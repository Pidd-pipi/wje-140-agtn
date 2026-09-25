export const databaseConfig = {
  type: 'mysql' as const,
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  username: process.env.DB_USER || 'fleet_user',
  password: process.env.DB_PASSWORD || 'fleet_password',
  database: process.env.DB_NAME || 'fleet_api',
  autoLoadEntities: true,
  synchronize: true
};
