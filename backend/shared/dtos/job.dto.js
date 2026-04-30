const createJobDTO = (data) => {
  return {
    _id: data._id,
    company: data.company,
    position: data.position,
    status: data.status,
    jobType: data.jobType,
    jobLocation: data.jobLocation,
    companyWebsite: data.companyWebsite,
    jobPostingUrl: data.jobPostingUrl,
    createdBy: data.createdBy,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

module.exports = { createJobDTO };
