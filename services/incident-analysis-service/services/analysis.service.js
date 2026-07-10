import client from '../util/openai.js';

const loggingServiceUrl = process.env.LOGGING_SERVICE || 'http://logging-service:4005';

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
  header.push('Analyse the following incident logs and produce an evidence-based incident analysis.');
  header.push(
    'The rootCause field must contain only a concise diagnosis (maximum six words). Do not include explanations in this field.',
  );
  if (correlationId) header.push(`Correlation ID: ${correlationId}`);

  header.push(
    'Use the rootCauseExplanation field to explain why the diagnosis was reached using only the supplied log evidence.',
  );
  header.push(
    'For supportingEvidence, provide only the key log entries that directly support the identified root cause. Summarise each entry in one concise sentence. Do not reproduce complete log records or include routine events that do not contribute to the diagnosis. (for example, REQUEST_RECEIVED, REQUEST_ROUTED, or RESPONSE_SENT unless they are directly relevant).',
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
    model: process.env.OPENAI_MODEL,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: 'You are an experienced Site Reliability Engineer analysing centralized logs from a distributed Dockerized application. Analyse incidents using only the information contained in the supplied logs. Base every conclusion on the available evidence. Do not invent missing information or make unsupported assumptions. Clearly distinguish observed evidence from inferred conclusions. If the available logs are insufficient to identify a probable root cause, state this in the rootCauseExplanation and reduce the confidence score accordingly.',
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
            confidence: { type: 'integer', minimum: 0, maximum: 100 },
            affectedServices: { type: 'array', items: { type: 'string' } },
            rootCauseService: { type: 'string' },
            summary: { type: 'string' },
            rootCause: { type: 'string' },
            rootCauseExplanation: { type: 'string' },
            supportingEvidence: { type: 'array', items: { type: 'string' } },
            recommendations: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: [
            'confidence',
            'affectedServices',
            'rootCauseService',
            'summary',
            'rootCause',
            'rootCauseExplanation',
            'supportingEvidence',
            'recommendations',
          ],
          additionalProperties: false,
        },
      },
    },
  });

  return JSON.parse(response.output_text);
};
