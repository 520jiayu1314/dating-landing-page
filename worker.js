export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 提交个人资料
    if (url.pathname === "/api/profile" && request.method === "POST") {
      try {
        const data = await request.json();

        const name = String(data.name || "").trim();
        const age = Number(data.age);
        const city = String(data.city || "").trim();
        const interests = String(data.interests || "").trim();
        const about = String(data.about || "").trim();

        if (!name || !age || !city) {
          return Response.json(
            { success: false, error: "Name, age and city are required." },
            { status: 400 }
          );
        }

        await env.DB
          .prepare(`
            INSERT INTO profiles
            (name, age, city, interests, about)
            VALUES (?, ?, ?, ?, ?)
          `)
          .bind(name, age, city, interests, about)
          .run();

        return Response.json({
          success: true,
          message: "Profile submitted successfully!"
        });
      } catch (error) {
        return Response.json(
          {
            success: false,
            error: error.message
          },
          { status: 500 }
        );
      }
    }

    // 其他请求交给静态网站
    return env.ASSETS.fetch(request);
  }
};
