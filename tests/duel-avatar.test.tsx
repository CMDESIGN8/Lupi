import {act,cleanup,render,screen} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {DuelAnimeEntrance} from '../src/components/DuelAnimeEntrance';
let width=300,height=320;
const observe=vi.fn(),disconnect=vi.fn();let resized:()=>void;
const props={game:'FUTSAL',leftName:'Christian',rightName:'Rival',leftAvatar:<div className="lp-owned-portrait"><div className="lp-owned-portrait__rig"/></div>,rightAvatar:<div className="arena-avatar"><div className="arena-avatar__rig"/></div>,leftLine:'¡Voy por el gol!',rightLine:'¡Leé mi jugada!',onDone:vi.fn()};
beforeEach(()=>{vi.useFakeTimers();width=300;height=320;observe.mockClear();disconnect.mockClear();props.onDone.mockClear();vi.spyOn(HTMLElement.prototype,'clientWidth','get').mockImplementation(()=>width);vi.spyOn(HTMLElement.prototype,'clientHeight','get').mockImplementation(()=>height);vi.stubGlobal('ResizeObserver',class{constructor(cb:()=>void){resized=cb}observe=observe;disconnect=disconnect})});
afterEach(()=>{cleanup();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals()});
describe('Encuadre de entrada al duelo',()=>{
 it('calcula la misma escala para los dos tipos de avatar',()=>{render(<DuelAnimeEntrance {...props}/>);const bodies=document.querySelectorAll<HTMLElement>('.duel-anime-entrance__body');expect(bodies).toHaveLength(2);for(const body of bodies)expect(Number(body.style.getPropertyValue('--entrance-rig-scale'))).toBeCloseTo(320/520*.94);expect(observe).toHaveBeenCalledTimes(2)});
 it('recalcula el encuadre al cambiar a un móvil estrecho',()=>{render(<DuelAnimeEntrance {...props}/>);width=130;height=240;act(()=>resized());const bodies=document.querySelectorAll<HTMLElement>('.duel-anime-entrance__body');for(const body of bodies)expect(Number(body.style.getPropertyValue('--entrance-rig-scale'))).toBeCloseTo(130/300*.94)});
 it('conserva nombres y diálogos, y cierra a los 3400 ms',async()=>{render(<DuelAnimeEntrance {...props}/>);expect(screen.getByText('Christian')).toBeTruthy();expect(screen.getByText('¡Leé mi jugada!')).toBeTruthy();await act(async()=>{await vi.advanceTimersByTimeAsync(3399)});expect(props.onDone).not.toHaveBeenCalled();await act(async()=>{await vi.advanceTimersByTimeAsync(1)});expect(props.onDone).toHaveBeenCalledTimes(1)});
 it('libera el observador y cancela el cierre al salir',async()=>{const{unmount}=render(<DuelAnimeEntrance {...props}/>);unmount();await act(async()=>{await vi.advanceTimersByTimeAsync(4000)});expect(disconnect).toHaveBeenCalledTimes(1);expect(props.onDone).not.toHaveBeenCalled()});
});
