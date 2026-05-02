/**
 * Calculate Shannon entropy of a string.
 * Used to measure unpredictability for secret material.
 *
 * @param {string} str
 * @returns {number}
 */
const calculateShannonEntropy = (str) => {
  const len = str.length;
  const frequencies = {};

  for (let i = 0; i < len; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }

  let entropy = 0;
  for (const char in frequencies) {
    const probability = frequencies[char] / len;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
};

module.exports = {
  calculateShannonEntropy,
};
