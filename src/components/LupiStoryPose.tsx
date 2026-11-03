import './LupiStoryPose.css';
export type LupiPose='welcome'|'explain'|'surprised'|'determined'|'sad'|'celebrate';
export function LupiStoryPose({pose='explain',className='',label='Lupi, tu entrenador'}:{pose?:LupiPose;className?:string;label?:string}){
 return <span className={`lupi-story-pose lupi-story-pose--${pose} ${className}`} role={label?'img':undefined} aria-label={label||undefined} aria-hidden={label?undefined:true}><i/></span>;
}
