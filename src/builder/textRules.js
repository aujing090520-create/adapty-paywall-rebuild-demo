import { textPropertyPatch } from './propertyModel.js';

export const TEXT_RULES = [['default','默认'],['introductory','首次优惠'],['promotional','促销优惠'],['multiphase','多阶段优惠']];
const fields = ['text','runs','textAlign','fontFamily','fontWeight','fontSize','color','colorOpacity','background','backgroundOpacity','textBackground','fillEnabled','bold','italic','strike','underline','contentOverridden'];
export const textRuleName = (value) => TEXT_RULES.some(([key]) => key === value) ? value : 'default';
export function textRuleProps(props, rule) {
  const override = props.textRules?.[textRuleName(rule)];
  return textRuleName(rule) === 'default' || !override ? props : { ...props, ...Object.fromEntries(fields.filter(key => override[key] !== undefined).map(key => [key, override[key]])),...(props.binding&&override.contentOverridden?{binding:null}:{}) };
}
export function textRulePatch(props, rule, values) {
  const name = textRuleName(rule);
  if (name === 'default') return values;
  const effective = textRuleProps(props, name);
  const snapshot = { ...Object.fromEntries(fields.filter(key => effective[key] !== undefined).map(key => [key, effective[key]])), runs: effective.runs ?? null };
  const patch = textPropertyPatch({type:'Text',props:effective}, values);
  return { textRules: { ...props.textRules, [name]: { ...snapshot, ...Object.fromEntries(fields.filter(key => patch[key] !== undefined).map(key => [key, patch[key]])),...(props.binding&&(values.text!==undefined||values.runs!==undefined)?{contentOverridden:true}:{}) } } };
}
