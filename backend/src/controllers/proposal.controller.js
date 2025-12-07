const proposalService = require("../services/proposal.service");
const emailService = require("../services/email.service");

exports.getProposalsByRfp = async (req, res, next) => {
  try {
    const proposals = await proposalService.getByRfp(req.params.rfpId);
    res.json({ proposals });
  } catch (error) {
    next(error);
  }
};

exports.pollEmails = async (req, res, next) => {
  try {
    const proposals = await emailService.pollIncomingEmails();  // Now returns proposals!
    // console.log(proposals)
    res.json({
      success: true,
      message: `Created ${proposals.length} new proposals!`,
      newProposals: proposals.length,
      proposals: proposals  // ✅ Send proposals back!
    });
  } catch (error) {
    next(error);
  }
};
