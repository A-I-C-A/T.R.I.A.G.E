// Redis is disabled - not needed for core functionality
export const connectRedis = async () => {
  console.log('ℹ️  Redis disabled - running without cache');
  return null;
};

export default null;
