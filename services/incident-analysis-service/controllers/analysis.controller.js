import { buildIncidentPrompt, fetchLogs, callOpenAI } from './../services/analysis.service.js';

const analyzeIncident = async (req, res) => {
  try {
    const { correlationId } = req.body;

    if (!correlationId) {
      const err = new Error('correlationId is required');
      err.statusCode = 400;
      throw err;
    }

    const logs = await fetchLogs({ correlationId });
    if (logs.length === 0) {
      const err = new Error('No logs found for the provided correlationId');
      err.statusCode = 404;
      throw err;
    }
    const prompt = buildIncidentPrompt({ logs, correlationId });
    const analysis = await callOpenAI(prompt);

    res.status(200).json({
      status: 'success',
      data: {
        correlationId: correlationId || null,
        logsCount: logs.length,
        analysis,
      },
    });
  } catch (err) {
    //console.log(err);
    res.status(err.statusCode || 500).json({
      status: 'fail',
      message: err.message || 'Unable to analyze incident',
    });
  }
};

export { analyzeIncident };
