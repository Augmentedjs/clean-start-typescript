export const ABOUT = "Express TypeScript Service";

const integerSetting = (value: string | undefined, fallback: number, name: string, maximum: number): number => {
  const result = value === undefined ? fallback : Number(value);
  if ((value !== undefined && !value.trim()) || !Number.isInteger(result) || result < 1 || result > maximum) {
    throw new Error(`${name} must be an integer between 1 and ${maximum}.`);
  }
  return result;
};

export const getConfig = (env: NodeJS.ProcessEnv = process.env) => {
  const port = integerSetting(env.PORT, 8080, "PORT", 65535);
  const workers = integerSetting(env.WEB_CONCURRENCY, 1, "WEB_CONCURRENCY", 256);
  const allowedOrigins = (env.ALLOWED_ORIGINS ?? `http://localhost:${port},http://localhost:8080,http://localhost:3000`)
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

  return { port, workers, allowedOrigins };
};
