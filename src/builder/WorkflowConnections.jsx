import React from 'react';

export const STEP_BOARD_GAP = 96;
export default function WorkflowConnections({ boards, edges, zoom, onSelect, onExitSelect }) {
  const width=390*zoom,height=844*zoom,mid=48+height/2;
  const connections=edges.flatMap((edge)=>{
    const from=boards.findIndex((board)=>board.owner===(edge.sourceOwner??null)&&board.node.id===edge.source),to=boards.findIndex((board)=>board.owner===(edge.targetOwner??null)&&board.node.id===edge.target);
    if(from<0||to<0||from===to)return [];
    const x1=from*(width+STEP_BOARD_GAP)+width,x2=to*(width+STEP_BOARD_GAP);
    const y=edge.kind==='exit'?48+height*0.78:mid;
    const path=to===from+1?`M${x1},${y} H${x2}`:`M${x1},${y} H${x1+18} V12 H${x2-18} V${y} H${x2}`;
    return [{...edge,x1,x2,y,path}];
  });
  return <div className="ne-workflow-connections" aria-label="步骤连接">
    <svg width={boards.length*(width+STEP_BOARD_GAP)} height={height+48} aria-hidden="true"><defs><marker id="workflow-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" fill="#7d86bc"/></marker></defs>{connections.map((edge)=><path key={edge.id} d={edge.path} fill="none" stroke={edge.kind==='exit'?'#33836b':'#9da2b8'} strokeWidth="2" strokeDasharray={edge.kind==='exit'||edge.auxiliary?'4 4':undefined} markerEnd="url(#workflow-arrow)"/>)}</svg>
    {connections.map((edge)=><button type="button" key={edge.id} className={edge.kind==='exit'?'ne-exit-connection':undefined} style={{left:edge.x1+4,top:edge.y-16}} title={edge.description??`配置：${edge.label}`} aria-label={edge.kind==='exit'?`配置退出触发：${edge.description}`:`编辑步骤连接：${edge.label}`} onClick={()=>edge.kind==='exit'?onExitSelect?.():onSelect(edge.id)}>{edge.label}</button>)}
  </div>;
}
