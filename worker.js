export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      const knownRoute =
        url.pathname === "/api/profile" ||
        url.pathname === "/api/contact";

      if (!knownRoute) {
        return json({ success: false, error: "Not found." }, 404);
      }

      if (request.method !== "POST") {
        return json(
          { success: false, error: "Method not allowed." },
          405,
          { Allow: "POST" }
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

      try {
        if (url.pathname === "/api/contact") {
          return await saveContact(data, env);
        }

        return await saveProfile(data, request, env);
      } catch (error) {
        console.error("Database operation failed:", error);

        return json(
          {
            success: false,
            error: "Unable to save your information. Please try again later."
          },
          500
        );
      }
    }

    return env.ASSETS.fetch(request);
  }
};

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

async function saveContact(data, env) {
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

  await env.DB.prepare(`
    INSERT INTO contacts (email, phone)
    VALUES (?, ?)
  `)
    .bind(email, phone)
    .run();

  return json({
    success: true,
    message: "Contact information saved."
  });
}

async function saveProfile(data, request, env) {
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

  const visitorId =
    request.headers.get("CF-Ray") || crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO profiles (
      visitor_id,
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
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .bind(
      visitorId,
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

  return json({
    success: true,
    message: "Profile saved."
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
