const { notFound } = require('../../middleware');

describe('Not Found Middleware', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  it('should return 404 status code', () => {
    notFound(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('should send "Route does not exist" message', () => {
    notFound(req, res);

    expect(res.send).toHaveBeenCalledWith('Route does not exist');
  });

  it('should handle multiple calls independently', () => {
    notFound(req, res);
    notFound(req, res);

    expect(res.status).toHaveBeenCalledTimes(2);
    expect(res.send).toHaveBeenCalledTimes(2);
  });
});
