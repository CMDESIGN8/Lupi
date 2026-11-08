import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
const h=vi.hoisted(()=>({entry:{} as any,confirm:vi.fn(),cancel:vi.fn()}));
vi.mock('../src/hooks/useDuelEntrance',()=>({useDuelEntrance:()=>h.entry}));
vi.mock('../src/components/OwnedCardPortrait',()=>({OwnedCardPortrait:({userId}:any)=><span data-testid="character" data-user={userId}/>}));
vi.mock('../src/components/match/ArenaAvatar',()=>({ArenaAvatar:()=>null}));
import {DuelVersus} from '../src/components/DuelVersus';
const challenge:any={id:'futsal',gameType:'futsal',fromId:'me',toId:'rival',fromName:'Christian',toName:'C. Mercado'};
const props={challenge,meId:'me',onStart:vi.fn(),onExit:vi.fn()};
beforeEach(()=>{h.confirm.mockClear();h.cancel.mockClear();props.onExit.mockClear();h.entry={connected:true,ready:false,rivalReady:false,cancelled:false,timedOut:false,seconds:null,confirm:h.confirm,cancel:h.cancel}});
afterEach(cleanup);
describe('Previa Futsal escritorio',()=>{
 it('presenta ambos personajes aunque falten en presencia del lobby',()=>{const{container:c}=render(<DuelVersus {...props}/>);expect(screen.getAllByTestId('character').map(n=>n.getAttribute('data-user'))).toEqual(['me','rival']);expect(c.querySelector('.duel-vs__avatar')).toBeNull();expect(screen.getByText('Christian')).toBeTruthy();expect(screen.getByText('C. Mercado')).toBeTruthy()});
 it('mantiene al usuario a la izquierda al entrar como visitante',()=>{render(<DuelVersus {...props} meId="rival"/>);expect(screen.getAllByTestId('character').map(n=>n.getAttribute('data-user'))).toEqual(['rival','me'])});
 it('coloca la cuenta en el centro, sin duplicarla ni tapar a los jugadores',()=>{h.entry={...h.entry,ready:true,rivalReady:true,seconds:2};const{container:c}=render(<DuelVersus {...props}/>);expect(c.querySelectorAll('.duel-vs__countdown')).toHaveLength(1);expect(c.querySelector('.duel-vs__duel-center>.duel-vs__countdown')).not.toBeNull();expect(screen.getAllByTestId('character')).toHaveLength(2);expect(screen.getByRole('timer').getAttribute('aria-label')).toContain('2');expect(screen.queryByRole('button',{name:'¡VAMOS A JUGAR! →'})).toBeNull()});
 it('respeta conexión y confirmación, y permite salir',()=>{h.entry={...h.entry,connected:false};const{rerender}=render(<DuelVersus {...props}/>);expect((screen.getByRole('button',{name:'¡VAMOS A JUGAR! →'}) as HTMLButtonElement).disabled).toBe(true);h.entry={...h.entry,connected:true};rerender(<DuelVersus {...props}/>);fireEvent.click(screen.getByRole('button',{name:'¡VAMOS A JUGAR! →'}));expect(h.confirm).toHaveBeenCalledTimes(1);fireEvent.click(screen.getByRole('button',{name:'VOLVER AL CLUB'}));expect(h.cancel).toHaveBeenCalledTimes(1);expect(props.onExit).toHaveBeenCalledTimes(1)});
 it('conserva la confirmación automática de búsqueda rápida',()=>{render(<DuelVersus {...props} challenge={{...challenge,quick:true}}/>);expect(h.confirm).toHaveBeenCalledTimes(1)});
 it('conserva las otras modalidades y su cuenta original',()=>{h.entry={...h.entry,seconds:1};const{container:c}=render(<DuelVersus {...props} challenge={{...challenge,gameType:'rps'}}/>);expect(c.querySelector('.duel-vs--futsal')).toBeNull();expect(c.querySelector('.duel-vs__countdown--center')).toBeNull();expect(c.querySelectorAll('.duel-vs__countdown')).toHaveLength(1);expect(screen.queryAllByTestId('character')).toHaveLength(0)});
});
