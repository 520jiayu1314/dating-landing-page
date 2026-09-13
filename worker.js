export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 保存联系方式
    if (
      url.pathname === "/api/contact" &&
      request.method === "POST"
    ) {
      return handleContact(request, env);
    }

    // 保存访客的匹配资料
    if (
      url.pathname === "/api/profile" &&
      request.method === "POST"
    ) {
      return handleProfile(request, env);
    }

    // 静态网站
    return env.ASSETS.fetch(request);
  }
};


/* =====================================================
   CONTACT
===================================================== */

async function handleContact(request, env) {
  try {
    const data = await request.json();

    const email = String(data.email || "").trim();
    const phone = String(data.phone || "").trim();

    if (!email || !phone) {
      return json({
        success: false,
        error: "Email and phone number are required."
      }, 400);
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return json({
        success: false,
        error: "Please enter a valid email address."
      }, 400);
    }

    const phonePattern =
      /^[0-9+\-\s().]{7,30}$/;

    if (!phonePattern.test(phone)) {
      return json({
        success: false,
        error: "Please enter a valid phone number."
      }, 400);
    }

    await env.DB
      .prepare(`
        INSERT INTO contacts (
          email,
          phone
        )
        VALUES (?, ?)
      `)
      .bind(
        email.slice(0, 200),
        phone.slice(0, 50)
      )
      .run();

    return json({
      success: true,
      message: "Contact information saved."
    });

  } catch (error) {
    console.error(error);

    return json({
      success: false,
      error: "Unable to save contact information."
    }, 500);
  }
}


/* =====================================================
   PROFILE
===================================================== */

async function handleProfile(request, env) {
  try {
    const data = await request.json();

    const name =
      String(data.name || "").trim();

    const age =
      Number(data.age);

    const city =
      String(data.city || "").trim();

    const interests =
      String(data.interests || "").trim();

    const about =
      String(data.about || "").trim();

    const ageRange =
      String(data.ageRange || "").trim();

    const personality =
      Array.isArray(data.personality)
        ? data.personality.join(", ")
        : String(data.personality || "").trim();

    const relationshipGoal =
      String(data.relationshipGoal || "").trim();

    const activities =
      Array.isArray(data.activities)
        ? data.activities.join(", ")
        : String(data.activities || "").trim();

    if (!name) {
      return json({
        success: false,
        error: "Name is required."
      }, 400);
    }

    if (
      !Number.isInteger(age) ||
      age < 18 ||
      age > 100
    ) {
      return json({
        success: false,
        error: "Please enter a valid age."
      }, 400);
    }

    if (!city) {
      return json({
        success: false,
        error: "City is required."
      }, 400);
    }

    const visitorId =
      request.headers.get("CF-Ray") ||
      crypto.randomUUID();

    await env.DB
      .prepare(`
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
        personality,
        relationshipGoal,
        activities
      )
      .run();

    return json({
      success: true
    });

  } catch (error) {
    console.error(error);

    return json({
      success: false,
      error: "Unable to save profile."
    }, 500);
  }
}


/* =====================================================
   JSON
===================================================== */

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=UTF-8",
        "Cache-Control":
          "no-store"
      }
    }
  );
}
