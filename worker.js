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

  // Validate basic information.
  if (!name || name.length > 100) {
    return json(
      {
        success: false,
        error: "Please enter a name of up to 100 characters."
      },
      400
    );
  }

  if (!Number.isInteger(age) || age < 18 || age > 100) {
    return json(
      {
        success: false,
        error: "Please enter an age between 18 and 100."
      },
      400
    );
  }

  if (!city || city.length > 150) {
    return json(
      {
        success: false,
        error: "Please enter a city of up to 150 characters."
      },
      400
    );
  }

  if (interests.length > 500 || about.length > 5000) {
    return json(
      {
        success: false,
        error: "Your introduction is too long."
      },
      400
    );
  }

  // Validate preferences.
  const ageRanges = [
    "25-35",
    "35-45",
    "45-55",
    "55+"
  ];

  if (!ageRanges.includes(ageRange)) {
    return json(
      {
        success: false,
        error: "Please select a preferred age range."
      },
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
      {
        success: false,
        error: "Please select at least one personality."
      },
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
      {
        success: false,
        error: "Please select your relationship goal."
      },
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
      {
        success: false,
        error: "Please select valid activities."
      },
      400
    );
  }

  // Read connection and browser information.
  const ipAddress = clientIp(request);
  const deviceType = detectDevice(request);
  const userAgent = (
    request.headers.get("User-Agent") || ""
  ).slice(0, 2000);

  // Save once per visitor_id.
  // Requires a UNIQUE constraint on visitor_profiles.visitor_id.
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
      activities,
      device_type,
      user_agent
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(visitor_id) DO NOTHING
  `)
    .bind(
      visitorId,
      ipAddress,
      name,
      age,
      city,
      interests,
      about,
      ageRange,
      personality.join(", "),
      relationshipGoal,
      activities.join(", "),
      deviceType,
      userAgent
    )
    .run();

  // Reject duplicate submissions.
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
