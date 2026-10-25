import React from 'react';
import { Plus } from 'lucide-react';

export const STEP_BOARD_GAP = 96;
export const STEP_CANVAS_GUTTER = 128;
export default function WorkflowConnections({ boards, edges, zoom, onSelect, onExitSelect, initialStepId, onAddStep, exitSourceId, exitSourceIds = [exitSourceId], onAddExit }) {
  const width=390*zoom,height=844*zoom,mid=48+height/2;
  const initial = boards.findIndex((board)=>board.owner===null&&board.node.id===initialStepId);
  const connections=edges.flatMap((edge, lane)=>{
    const from=boards.findIndex((board)=>board.owner===(edge.sourceOwner??null)&&board.node.id===edge.source),to=boards.findIndex((board)=>board.owner===(edge.targetOwner??null)&&board.node.id===edge.target);
    if(from<0||to<0||from===to)return [];
    const x1=STEP_CANVAS_GUTTER+from*(width+STEP_BOARD_GAP)+width,x2=STEP_CANVAS_GUTTER+to*(width+STEP_BOARD_GAP);
    const y=edge.kind==='exit'?48+height*0.78:mid;
    const rail = 10 + (lane % 3) * 12;
    const path=to===from+1?`M${x1},${y} H${x2}`:`M${x1},${y} H${x1+18} V${rail} H${x2-18} V${y} H${x2}`;
    return [{...edge,x1,x2,y,path}];
  });
  return <div className="ne-workflow-connections" aria-label="步骤连接">
    <svg width={STEP_CANVAS_GUTTER+boards.length*(width+STEP_BOARD_GAP)} height={height+48} aria-hidden="true"><defs><marker id="workflow-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" fill="#7d86bc"/></marker></defs>{initial>=0&&<path d={`M${initial*(width+STEP_BOARD_GAP)+32},${mid} H${STEP_CANVAS_GUTTER+initial*(width+STEP_BOARD_GAP)}`} fill="none" stroke="#6473d9" strokeWidth="2" markerEnd="url(#workflow-arrow)"/>}{connections.map((edge)=><path key={edge.id} d={edge.path} fill="none" stroke={edge.kind==='exit'?'#33836b':'#9da2b8'} strokeWidth="2" strokeDasharray={edge.kind==='exit'||edge.auxiliary?'4 4':undefined} markerEnd="url(#workflow-arrow)"/>)}</svg>
    {initial>=0&&<div className="ne-canvas-start" style={{left:initial*(width+STEP_BOARD_GAP),top:mid-16}}>{onAddStep&&<button type="button" aria-label="添加步骤" title="添加步骤" onClick={onAddStep}><Plus size={16}/></button>}<span>初始步骤</span></div>}
    {onAddExit&&boards.map((board,index)=>board.owner===null&&exitSourceIds.includes(board.node.id)&&!edges.some((edge)=>edge.kind==='exit'&&edge.source===board.node.id)&&<button type="button" key={board.key} className="ne-canvas-close" style={{left:STEP_CANVAS_GUTTER+index*(width+STEP_BOARD_GAP)+width+4,top:48+height*0.78-16}} aria-label={`配置关闭「${board.label}」后的挽留`} title={`Demo 扩展：关闭「${board.label}」后显示`} onClick={()=>onAddExit(board.node.id)}>关闭页面<Plus size={13}/></button>)}
    {connections.map((edge)=><button type="button" key={edge.id} className={edge.kind==='exit'?'ne-exit-connection':undefined} style={{left:edge.x1+4,top:edge.y-16}} title={edge.description??`配置：${edge.label}`} aria-label={edge.kind==='exit'?`配置退出触发：${edge.description}`:`编辑步骤连接：${edge.label}`} onClick={()=>edge.kind==='exit'?onExitSelect?.(edge):onSelect(edge.id)}>{edge.label}</button>)}
  </div>;
}
