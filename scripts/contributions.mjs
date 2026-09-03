/*
  Fetches the contribution calendar for a GitHub login and normalises it into
  columns of daily levels (0–4), the shape the snake renderer walks over.
*/

const LEVELS = Object.freeze({
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
});

const QUERY = `query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays { weekday contributionLevel }
        }
      }
    }
  }
}`;

/** A week arrives partially filled at both ends of the year; missing days stay null. */
export function normaliseCalendar(calendar) {
  const weeks = calendar.weeks.map((week) => {
    const column = Array.from({ length: 7 }, () => null);

    for (const day of week.contributionDays) {
      const level = LEVELS[day.contributionLevel];

      if (level === undefined) {
        throw new Error(`Unknown contribution level "${day.contributionLevel}"`);
      }

      column[day.weekday] = level;
    }

    return column;
  });

  return { total: calendar.totalContributions, weeks };
}

export async function fetchContributions({
  login,
  token,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!login) {
    throw new Error("A GitHub login is required to fetch contributions");
  }

  if (!token) {
    throw new Error("A GitHub token is required to fetch contributions");
  }

  const response = await fetchImpl("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "user-agent": "haotian14-profile",
    },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });

  if (!response.ok) {
    throw new Error(
      `GitHub GraphQL request failed with ${response.status} ${response.statusText}`,
    );
  }

  const payload = await response.json();

  if (payload.errors?.length) {
    throw new Error(
      `GitHub GraphQL error: ${payload.errors.map((error) => error.message).join("; ")}`,
    );
  }

  const calendar =
    payload.data?.user?.contributionsCollection?.contributionCalendar;

  if (!calendar) {
    throw new Error(`No contribution calendar returned for "${login}"`);
  }

  return normaliseCalendar(calendar);
}
