import client from '../util/openai.js';

const loggingServiceUrl = process.env.LOGGING_SERVICE || 'http://logging-service:4005';
const maxLogs = Number(process.env.MAX_LOGS || 40);

export const fetchLogs = async ({ correlationId }) => {
  if (correlationId) {
    const response = await fetch(`${loggingServiceUrl}/api/v1/logs/${encodeURIComponent(correlationId)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch logs for correlationId');
    }
    const result = await response.json();
    return result.data || [];
  }

  return [];
};

export const buildIncidentPrompt = ({ logs, correlationId }) => {
  // Build a prompt for the OpenAI model based on the logs and correlationId
  const summary = logs
    .map((log) => {
      const timestamp = new Date(log.timestamp).toISOString();
      const details = `service=${log.service} severity=${log.severity} event=${log.event} correlationId=${log.correlationId || 'none'} message=${log.message}`;
      const metadata = log.metadata ? ` metadata=${JSON.stringify(log.metadata)}` : '';
      return `${timestamp} | ${details}${metadata}`;
    })
    .join('\n');

  // Construct the prompt with instructions for the AI model
  const header = [];
  header.push('Analyse the following distributed application logs to determine what incident occurred.');
  header.push(
    'Use timestamps, severity levels, events, correlation IDs, messages and metadata when identifying the sequence of events.',
  );
  if (correlationId) header.push(`Correlation ID: ${correlationId}`);

  header.push(
    'If the available logs are insufficient to determine a definitive cause, state this clearly and lower your confidence.',
  );
  header.push('Logs:');

  return `${header.join(' ')}\n\n${summary}`;
};

export const callOpenAI = async (prompt) => {
  // If MOCK_OPENAI is set to true, return a mock response for testing purposes
  if (process.env.MOCK_OPENAI === 'true') {
    return JSON.stringify({
      summary: 'Mock summary of the incident based on logs.',
      rootCause: 'Mock root cause analysis.',
      timeline: 'Mock timeline of events.',
      recommendations: 'Mock recommendations for next steps.',
    });
  }

  // Call the OpenAI API with the constructed prompt and return the response
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-5.4-mini',
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: 'You are a Site Reliability Engineer that analyses distributed application logs.',
          },
        ],
      },
      { role: 'user', content: [{ type: 'input_text', text: prompt }] },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'incident_analysis',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            incidentSeverity: { type: 'string', enum: ['LOW', 'HIGH', 'MEDIUM', 'CRITICAL'] },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            affectedServices: { type: 'array', items: { type: 'string' } },
            rootCauseService: { type: 'string' },
            summary: { type: 'string' },
            rootCause: { type: 'string' },
            supportingEvidence: { type: 'array', items: { type: 'string' } },
            timeline: { type: 'array', items: { type: 'string' } },
            recommendations: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: [
            'incidentSeverity',
            'confidence',
            'affectedServices',
            'rootCauseService',
            'summary',
            'rootCause',
            'supportingEvidence',
            'timeline',
            'recommendations',
          ],
          additionalProperties: false,
        },
      },
    },
  });

  return JSON.parse(response.output_text);
};
