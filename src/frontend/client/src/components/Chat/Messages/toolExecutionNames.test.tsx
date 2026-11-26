import React from 'react';
import { render, screen } from '@testing-library/react';
import { createInstance } from 'i18next';
import { resources } from '~/locales/i18n';
import { ToolRowLite } from '~/components/Linsight/Execution/ToolRowLite';
import { mergeStepFrames } from '~/components/Linsight/Execution/stepTree';
import ToolCallDisplay from './ToolCallDisplay';

const mockI18n = createInstance();
jest.mock('~/hooks', () => ({ useLocalize: () => mockI18n.t.bind(mockI18n) }));
jest.mock('~/utils', () => ({ cn: (...classes: string[]) => classes.filter(Boolean).join(' ') }));
jest.mock('bisheng-icons', () => ({ Outlined: new Proxy({}, { get: () => () => null }) }));

const tool = 'bisheng_code_interpreter';
const dailyCall = { tool_call_id: 'call', tool_name: tool, display_name: tool };
function taskStep(name: string, status: 'start' | 'end') {
  const [step] = mergeStepFrames([{ call_id: 'call', name, status }]);
  if (!step) throw new Error('Expected a tool step');
  return step;
}

beforeAll(async () => {
  await mockI18n.init({ resources, lng: 'en', defaultNS: 'translation', fallbackLng: 'en' });
});

test.each(['zh-Hans', 'en', 'ja'] as const)('daily and task tool rows use the %s catalog name', async language => {
  await mockI18n.changeLanguage(language);
  const name = resources[language].tool.tools[tool].name;
  const running = mockI18n.t('com_tools_state_tool_running', { name });
  const done = mockI18n.t('com_tools_state_tool_done', { name });
  const failed = mockI18n.t('com_tools_state_tool_failed', { name });

  const view = render(<ToolCallDisplay toolCall={{ ...dailyCall, inflight: true }} />);
  expect(screen.getByText(running)).toBeInTheDocument();
  view.rerender(<ToolCallDisplay toolCall={dailyCall} />);
  expect(screen.getByText(done)).toBeInTheDocument();
  view.rerender(<ToolCallDisplay toolCall={{ ...dailyCall, error: 'timeout' }} />);
  expect(screen.getByText(failed)).toBeInTheDocument();
  view.rerender(<ToolRowLite step={taskStep(tool, 'start')} />);
  expect(screen.getByText(running)).toBeInTheDocument();
  view.rerender(<ToolRowLite step={taskStep(tool, 'end')} />);
  expect(screen.getByText(done)).toBeInTheDocument();
});

test('unknown tools retain the supplied name and specialized task actions retain their verb', async () => {
  await mockI18n.changeLanguage('en');
  const view = render(<ToolCallDisplay toolCall={{ tool_call_id: 'call', tool_name: 'custom_report', display_name: 'Monthly report' }} />);
  expect(screen.getByText('Used Monthly report')).toBeInTheDocument();
  view.rerender(<ToolRowLite step={taskStep('custom_report', 'end')} />);
  expect(screen.getByText('Used custom_report')).toBeInTheDocument();
  view.rerender(<ToolRowLite step={taskStep('write_file', 'end')} />);
  expect(screen.getByText(mockI18n.t('com_tools_state_write_file_done'))).toBeInTheDocument();
});
