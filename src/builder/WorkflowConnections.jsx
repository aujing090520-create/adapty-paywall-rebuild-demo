import React from 'react';

export const STEP_BOARD_GAP = 96;
export default function WorkflowConnections({ boards, edges, zoom, onSelect }) {
  const width=390*zoom,height=844*zoom,mid=48+height/2;
  const connections=edges.flatMap((edge)=>{
    const from=boards.findIndex((board)=>board.owner===null&&board.node.id===edge.source),to=boards.findIndex((board)=>board.owner===null&&board.node.id===edge.target);
    if(from<0||to<0||from===to)return [];
    const x1=from*(width+STEP_BOARD_GAP)+width,x2=to*(width+STEP_BOARD_GAP);
    const path=to===from+1?`M${x1},${mid} H${x2}`:`M${x1},${mid} H${x1+18} V12 H${x2-18} V${mid} H${x2}`;
    return [{...edge,x1,x2,path}];
  });
  return <div className="ne-workflow-connections" aria-label="步骤连接">
    <svg width={boards.length*(width+STEP_BOARD_GAP)} height={height+48} aria-hidden="true"><defs><marker id="workflow-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0 L7 3.5 L0 7 Z" fill="#7d86bc"/></marker></defs>{connections.map((edge)=><path key={edge.id} d={edge.path} fill="none" stroke="#9da2b8" strokeWidth="2" strokeDasharray={edge.auxiliary?'4 4':undefined} markerEnd="url(#workflow-arrow)"/>)}</svg>
    {connections.map((edge)=><button type="button" key={edge.id} style={{left:edge.x1+4,top:mid-16}} title={`配置：${edge.label}`} aria-label={`编辑步骤连接：${edge.label}`} onClick={()=>onSelect(edge.id)}>{edge.label}</button>)}
  </div>;
}
