import Goal from '../models/Goal.js';
import { generateGoalBreakdown } from '../services/geminiService.js';

export const getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createGoal = async (req, res) => {
  const { title, description, targetDate, progress, keyResults } = req.body;

  try {
    const goal = new Goal({
      userId: req.user._id,
      title,
      description: description || '',
      targetDate: targetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default to 30 days from now
      progress: progress || 0,
      milestones: [],
      keyResults: keyResults || []
    });

    const createdGoal = await goal.save();

    res.status(201).json(createdGoal);

    // Call Gemini breakdown asynchronously
    generateGoalBreakdown(createdGoal)
      .then(async (milestones) => {
        if (Array.isArray(milestones) && milestones.length > 0) {
          await Goal.findByIdAndUpdate(createdGoal._id, {
            milestones: milestones.map(m => ({
              week: m.week,
              milestone: m.milestone,
              effort: m.effort || 'medium',
              done: false
            }))
          });
          console.log(`[Goal AI] Asynchronously updated milestones breakdown for goal ${createdGoal._id}`);
        }
      })
      .catch(err => {
        console.error('[Goal AI] Error generating goal breakdown in background:', err);
      });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (goal && goal.userId.toString() === req.user._id.toString()) {
      goal.title = req.body.title !== undefined ? req.body.title : goal.title;
      goal.description = req.body.description !== undefined ? req.body.description : goal.description;
      goal.targetDate = req.body.targetDate !== undefined ? req.body.targetDate : goal.targetDate;
      goal.progress = req.body.progress !== undefined ? req.body.progress : goal.progress;
      goal.milestones = req.body.milestones !== undefined ? req.body.milestones : goal.milestones;
      goal.keyResults = req.body.keyResults !== undefined ? req.body.keyResults : goal.keyResults;

      const updatedGoal = await goal.save();
      res.json(updatedGoal);
    } else {
      res.status(404).json({ message: 'Goal not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findById(req.params.id);

    if (goal && goal.userId.toString() === req.user._id.toString()) {
      await goal.deleteOne();
      res.json({ message: 'Goal removed' });
    } else {
      res.status(404).json({ message: 'Goal not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
