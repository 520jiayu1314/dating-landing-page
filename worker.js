export default {
    async fetch(request, env) {

        const url = new URL(request.url);


        // ============================
        // POST /api/profile
        // ============================

        if (
            url.pathname === "/api/profile" &&
            request.method === "POST"
        ) {

            try {

                const data =
                    await request.json();


                const name =
                    String(data.name || "").trim();

                const age =
                    Number(data.age);

                const city =
                    String(data.city || "").trim();

                const interests =
                    String(
                        data.interests || ""
                    ).trim();

                const about =
                    String(
                        data.about || ""
                    ).trim();

                const ageRange =
                    String(
                        data.ageRange || ""
                    ).trim();

                const personality =
                    String(
                        data.personality || ""
                    ).trim();

                const relationshipGoal =
                    String(
                        data.relationshipGoal || ""
                    ).trim();

                const activities =
                    String(
                        data.activities || ""
                    ).trim();


                // ============================
                // VALIDATION
                // ============================

                if (
                    !name ||
                    !age ||
                    !city
                ) {

                    return Response.json(
                        {
                            success: false,
                            error:
                                "Name, age and city are required."
                        },
                        {
                            status: 400
                        }
                    );
                }


                if (
                    age < 18 ||
                    age > 100
                ) {

                    return Response.json(
                        {
                            success: false,
                            error:
                                "Invalid age."
                        },
                        {
                            status: 400
                        }
                    );
                }


                // ============================
                // INSERT INTO D1
                // ============================

                await env.DB
                    .prepare(`
                        INSERT INTO profiles
                        (
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
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `)

                    .bind(
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


                return Response.json({

                    success: true,

                    message:
                        "Profile submitted successfully."

                });


            } catch (error) {

                console.error(error);


                return Response.json(

                    {
                        success: false,
                        error: error.message
                    },

                    {
                        status: 500
                    }

                );
            }
        }


        // ============================
        // STATIC WEBSITE
        // ============================

        return env.ASSETS.fetch(request);
    }
};
