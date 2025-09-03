const register = async (req, res) => {
  res.send('user registered...')
};

const login = async (req, res) => {
  res.send('user logged in...')
};

module.exports = {
  register,
  login
};