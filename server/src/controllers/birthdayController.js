const birthdayService = require('../services/birthdayService');

exports.getFriendsBirthdays = async (req, res) => {
  try {
    const { userId } = req.params;
    const birthdays = await birthdayService.getFriendsBirthdays(userId);
    res.json(birthdays);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getFriendsBirthdaysForYear = async (req, res) => {
  try {
    const { userId, year } = req.params;
    const birthdays = await birthdayService.getFriendsBirthdaysForYear(userId, parseInt(year));
    res.json(birthdays);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUpcomingBirthdays = async (req, res) => {
  try {
    const { userId } = req.params;
    const birthdays = await birthdayService.getUpcomingBirthdays(userId);
    res.json(birthdays);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTodaysBirthdays = async (req, res) => {
  try {
    const { userId } = req.params;
    const birthdays = await birthdayService.getTodaysBirthdays(userId);
    res.json(birthdays);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 