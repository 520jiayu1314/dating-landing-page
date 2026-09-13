const COOKIE_NAME = "__Host-visitor_id";
const COOKIE_SECONDS = 60 * 60 * 24 * 365;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const isHome =
      url.pathname === "/" ||
      url.pathname === "/index" ||
      url.pathname === "/index.html";

    const isContactPage =
      url.pathname === "/contact" ||
      url.pathname === "/contact.html";

    const isApi = url.pathname.startsWith("/api/");

    const isPage = isHome || isContactPage;

    // Images, CSS and JavaScript do not need a visitor lookup.
    if (!isPage && !isApi) {
      return env.ASSETS.fetch(request);
    }

    let session;

    try {
      session = await getSession(request, env);

      let response;

      if (isApi) {
        response = await handleApi(request, env, url, session);
      } else if (
        isHome &&
        (request.method === "GET" || request.method === "HEAD")
      ) {
        const submitted = await env.DB.prepare(`
          SELECT id
          FROM visitor_profiles
          WHERE visitor_id = ?
          LIMIT 1
        `)
          .bind(session.id)
          .first();

        if (submitted) {
          response = completedPage(request.method === "HEAD");
        } else {
          response = await env.ASSETS.fetch(request);
        }
      } else {
        // Keep the contact page available after profile submission.
        response = await env.ASSETS.fetch(request);
      }

      return withVisitorHeaders(response, session);
    } catch (error) {
      console.error("Visitor request failed:", error);

      const response = isApi
        ? json(
            {
              success: false,
              error: "Unable to save your information. Please try again later."
            },
            500
          )
        : new Response(
            "The website is temporarily unavailable. Please try again later.",
            {
              status: 503,
              headers: {
                "Content-Type": "text/plain; charset=UTF-8"
              }
            }
          );

      return withVisitorHeaders(response, session);
    }
  }
};

async function getSession(request, env) {
  const cookieHeader = request.headers.get("Cookie") || "";

  const cookie = cookieHeader
    .split(";")
    .map(part => part.trim())
    .find(part => part.startsWith(COOKIE_NAME + "="));

  const candidate = cookie
    ? cookie.slice(COOKIE_NAME.length + 1)
    : "";

  const now = Math.floor(Date.now() / 1000);

  // Only accept IDs that were previously issued by this Worker.
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      candidate
    )
  ) {
    const stored = await env.DB.prepare(`
      SELECT visitor_id
      FROM visitor_sessions
      WHERE visitor_id = ?
        AND expires_at > ?
      LIMIT 1
    `)
      .bind(candidate, now)
      .first();

    if (stored) {
      return {
        id: stored.visitor_id,
        isNew: false
      };
    }
  }

  const id = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO visitor_sessions (visitor_id, expires_at)
    VALUES (?, ?)
  `)
    .bind(id, now + COOKIE_SECONDS)
    .run();

  return {
    id,
    isNew: true
  };
}

function withVisitorHeaders(response, session) {
  const result = new Response(response.body, response);

  // Do not cache personalized pages or API responses.
  result.headers.set("Cache-Control", "private, no-store");
  result.headers.set("Vary", "Cookie");

  if (session && session.isNew) {
    result.headers.append(
      "Set-Cookie",
      `${COOKIE_NAME}=${session.id}; Path=/; Max-Age=${COOKIE_SECONDS}; HttpOnly; Secure; SameSite=Lax`
    );
  }

  return result;
}

function clientIp(request) {
  // Preserve original IPv6 if Cloudflare Pseudo IPv4 overwrite is enabled.
  return (
    request.headers.get("CF-Connecting-IPv6") ||
    request.headers.get("CF-Connecting-IP") ||
    null
  );
}

async function handleApi(request, env, url, session) {
  const knownPath =
    url.pathname === "/api/profile" ||
    url.pathname === "/api/contact";

  if (!knownPath) {
    return json(
      { success: false, error: "Not found." },
      404
    );
  }

  if (request.method !== "POST") {
    return json(
      { success: false, error: "Method not allowed." },
      405,
      { Allow: "POST" }
    );
  }

  // The existing frontend submits to the same website origin.
  const origin = request.headers.get("Origin");

  if (origin && origin !== url.origin) {
    return json(
      { success: false, error: "Request origin is not allowed." },
      403
    );
  }

  // The visitor must first receive and return a valid cookie.
  if (session.isNew) {
    return json(
      {
        success: false,
        error: "Please enable cookies, reload the page, and try again."
      },
      403
    );
  }

  const contentType = request.headers.get("Content-Type") || "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return json(
      { success: false, error: "Please send JSON data." },
      415
    );
  }

  let data;

  try {
    const body = await request.text();

    if (body.length > 20000) {
      return json(
        { success: false, error: "Submitted information is too large." },
        413
      );
    }

    data = JSON.parse(body);
  } catch {
    return json(
      { success: false, error: "Invalid JSON data." },
      400
    );
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return json(
      { success: false, error: "Invalid request data." },
      400
    );
  }

  if (url.pathname === "/api/profile") {
    return saveProfile(data, request, env, session.id);
  }

  return saveContact(data, request, env, session.id);
}

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validChoices(value, allowed) {
  return (
    Array.isArray(value) &&
    value.length <= allowed.length &&
    value.every(item => allowed.includes(item)) &&
    new Set(value).size === value.length
  );
}

async function saveProfile(data, request, env, visitorId) {
  const name = text(data.name);
  const age = data.age;
  const city = text(data.city);
  const interests = text(data.interests);
  const about = text(data.about);
  const ageRange = text(data.ageRange);
  const relationshipGoal = text(data.relationshipGoal);
  const personality = data.personality;
  const activities = data.activities;

  if (!name || name.length > 100) {
    return json(
      { success: false, error: "Please enter a name of up to 100 characters." },
      400
    );
  }

  if (!Number.isInteger(age) || age < 18 || age > 100) {
    return json(
      { success: false, error: "Please enter an age between 18 and 100." },
      400
    );
  }

  if (!city || city.length > 150) {
    return json(
      { success: false, error: "Please enter a city of up to 150 characters." },
      400
    );
  }

  if (interests.length > 500 || about.length > 5000) {
    return json(
      { success: false, error: "Your introduction is too long." },
      400
    );
  }

  if (!["25-35", "35-45", "45-55", "55+"].includes(ageRange)) {
    return json(
      { success: false, error: "Please select a preferred age range." },
      400
    );
  }

  const personalityOptions = [
    "Kind",
    "Caring",
    "Romantic",
    "Independent",
    "Family-oriented",
    "Outgoing"
  ];

  if (
    !validChoices(personality, personalityOptions) ||
    personality.length === 0
  ) {
    return json(
      { success: false, error: "Please select at least one personality." },
      400
    );
  }

  const goals = [
    "Serious relationship",
    "Marriage",
    "Dating",
    "Friendship first"
  ];

  if (!goals.includes(relationshipGoal)) {
    return json(
      { success: false, error: "Please select your relationship goal." },
      400
    );
  }

  const activityOptions = [
    "Travel",
    "Cooking",
    "Music",
    "Sports",
    "Movies",
    "Reading"
  ];

  if (!validChoices(activities, activityOptions)) {
    return json(
      { success: false, error: "Please select valid activities." },
      400
    );
  }

  // UNIQUE(visitor_id) makes this safe for concurrent submissions.
  const result = await env.DB.prepare(`
    INSERT INTO visitor_profiles (
      visitor_id,
      ip_address,
      name,
      age,
      city,
      interests,
      about,
      age_range,
      personality,
      relationship_goal,
      activities
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(visitor_id) DO NOTHING
  `)
    .bind(
      visitorId,
      clientIp(request),
      name,
      age,
      city,
      interests,
      about,
      ageRange,
      personality.join(", "),
      relationshipGoal,
      activities.join(", ")
    )
    .run();

  if (result.meta.changes === 0) {
    return json(
      {
        success: false,
        alreadySubmitted: true,
        error: "You have already completed your profile."
      },
      409
    );
  }

  return json({
    success: true,
    message: "Profile saved."
  });
}

async function saveContact(data, request, env, visitorId) {
  const email = text(data.email);
  const phone = text(data.phone);
  const digitCount = phone.replace(/\D/g, "").length;

  if (
    !email ||
    email.length > 200 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return json(
      { success: false, error: "Please enter a valid email address." },
      400
    );
  }

  if (
    !phone ||
    phone.length > 30 ||
    !/^\+?[0-9\s().-]+$/.test(phone) ||
    digitCount < 7 ||
    digitCount > 15
  ) {
    return json(
      { success: false, error: "Please enter a valid phone number." },
      400
    );
  }

  const result = await env.DB.prepare(`
    INSERT INTO visitor_contacts (
      visitor_id,
      ip_address,
      email,
      phone
    )
    VALUES (?, ?, ?, ?)
    ON CONFLICT(visitor_id) DO NOTHING
  `)
    .bind(
      visitorId,
      clientIp(request),
      email,
      phone
    )
    .run();

  if (result.meta.changes === 0) {
    return json(
      {
        success: false,
        alreadySubmitted: true,
        error: "You have already submitted your contact information."
      },
      409
    );
  }

  return json({
    success: true,
    message: "Contact information saved."
  });
}

function completedPage(headOnly) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Profile Completed</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <header class="header">
    <span class="logo">MeetUp</span>
  </header>

  <main>
    <section class="card">
      <h1>You have already completed your profile.</h1>
      <p>你已经完成资料，请勿重复提交。</p>
      <p>Thank you. Your information has been received.</p>

      <a class="button primary" href="/contact.html">
        Leave Your Contact Information
      </a>

      <p>
        <a href="https://wa.me/13463951368"
           target="_blank"
           rel="noopener noreferrer">
          WhatsApp
        </a>
        ·
        <a href="https://t.me/jiayu888"
           target="_blank"
           rel="noopener noreferrer">
          Telegram
        </a>
      </p>
    </section>
  </main>
</body>
</html>`;

  return new Response(headOnly ? null : html, {
    headers: {
      "Content-Type": "text/html; charset=UTF-8"
    }
  });
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}
