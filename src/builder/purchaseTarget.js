import {indexDocument} from './componentDocument.js';
import {owningScreen,owningModal} from './workflow.js';
import {logicNode} from './paywallLogic.js';

export function purchaseTargets(document,button,runtime={},selected){
  const screen=owningScreen(document,button.id),modal=owningModal(document,button.id);
  const {nodes,parents}=indexDocument(document);
  const available=node=>{
    let current=node;
    while(current){
      const props=logicNode(current,document,runtime,selected).props;
      if(props.hidden)return false;
      if(props.visibleWhen&&Boolean(runtime[props.visibleWhen.id]??nodes.get(props.visibleWhen.id)?.props.initial)!==props.visibleWhen.value)return false;
      if(current.type==='SwitchCase'){const owner=nodes.get(parents.get(current.id));if(props.index!==(runtime[owner?.id]??owner?.props.defaultIndex??0))return false;}
      current=nodes.get(parents.get(current.id));
    }
    return true;
  };
  return [...nodes.values()].filter(node=>node.type==='Package'&&available(node)&&owningScreen(document,node.id)?.id===screen?.id&&owningModal(document,node.id)?.id===modal?.id);
}
export function purchaseTarget(document,button,selected,runtime={}){
  const id=button.props.action?.packageId;
  return id?purchaseTargets(document,button,runtime,selected).find(node=>node.id===id)??null:selected;
}
