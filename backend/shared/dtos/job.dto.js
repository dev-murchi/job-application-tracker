/**
 * Job Data Transfer Object.
 *
 * Safe, flattened job shape returned to API consumers.
 *
 * @typedef {Object} JobDTO
 * @property {string}  _id
 * @property {string}  position
 * @property {string}  company
 * @property {string}  status
 * @property {string}  jobType
 * @property {string}  jobLocation
 * @property {string}  [companyWebsite]
 * @property {string}  [jobPostingUrl]
 * @property {string}  createdBy
 * @property {Date}  createdAt
 * @property {Date}  updatedAt
 */

/**
 * Creates a JobDTO from a job data object.
 *
 * @param {Object} data - The raw job data object, typically from the database.
 * @returns {JobDTO} The formatted Job Data Transfer Object.
 */
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
