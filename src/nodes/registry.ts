import { StartNode } from './StartNode/StartNode';
import { TaskNode } from './TaskNode/TaskNode';
import { ApprovalNode } from './ApprovalNode/ApprovalNode';
import { AutomatedStepNode } from './AutomatedStepNode/AutomatedStepNode';
import { EndNode } from './EndNode/EndNode';

export const nodeTypes = {
  start: StartNode,
  task: TaskNode,
  approval: ApprovalNode,
  automated_step: AutomatedStepNode,
  end: EndNode,
};