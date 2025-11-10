/**
 * Format user data for response (exclude sensitive fields)
 */
const formatUserResponse = (user) => ({
  email: user.email,
  lastName: user.lastName,
  location: user.location,
  name: user.name,
});

module.exports = { formatUserResponse };
