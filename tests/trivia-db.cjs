const fs=require('fs');
const assert=require('assert/strict');
const {PGlite}=require('@electric-sql/pglite');
(async()=>{
 const db=new PGlite();
 await db.exec(`create role anon; create role authenticated; create schema auth; create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
 const sql=fs.readFileSync(require('path').join(__dirname, '../supabase/migrations/20261030_social_trivia.sql'),'utf8');
 await db.exec(sql); await db.exec(sql);
 const host='11111111-1111-4111-8111-111111111111',guest='22222222-2222-4222-8222-222222222222',other='33333333-3333-4333-8333-333333333333',id='44444444-4444-4444-8444-444444444444';
 const who=async u=>db.query("select set_config('request.jwt.claim.sub',$1,false)",[u]);
 const rpc=async (name,params)=> (await db.query(`select public.${name}(${params.map((_,i)=>'$'+(i+1)).join(',')}) as s`,params)).rows[0].s;
 await who(host);let s=await rpc('trivia_start',[id,host,guest]);assert.equal(s.round,1);assert.equal(s.question.options.length,4);assert.ok(!JSON.stringify(s).includes('answer'));
 await who(guest);assert.equal((await rpc('trivia_start',[id,host,guest])).id,id);
 await who(other);await assert.rejects(()=>rpc('trivia_state',[id]));await assert.rejects(()=>rpc('trivia_answer',[id,1,0]));
 for(let round=1;round<=5;round++){
  const q=(await db.query('select q.answer from lupi_trivia_private.matches m join lupi_trivia_private.questions q on q.id=m.questions[m.round] where m.id=$1',[id])).rows[0].answer;
  await who(host); s=await rpc('trivia_answer',[id,round,q]);assert.equal(s.mineSubmitted,true);assert.equal(s.round,round);assert.equal(s.hostScore,round-1);
  assert.equal((await rpc('trivia_answer',[id,round,(q+1)%4])).hostScore,round-1);
  await who(guest);s=await rpc('trivia_answer',[id,round,(q+1)%4]);assert.equal(s.hostScore,round);assert.equal(s.guestScore,0);assert.equal(s.lastResult.round,round);
  const again=await rpc('trivia_answer',[id,round,q]);assert.equal(again.hostScore,round);assert.equal(again.mineSubmitted,false);
 }
 assert.equal(s.status,'finished');assert.equal(s.winnerId,host);assert.equal(s.question,null);
 await who(host);await assert.rejects(()=>rpc('trivia_answer',[id,5,4]));
 const id2='55555555-5555-4555-8555-555555555555';await rpc('trivia_start',[id2,host,guest]);await db.query("update lupi_trivia_private.matches set deadline=clock_timestamp()-interval '1 second' where id=$1",[id2]);s=await rpc('trivia_answer',[id2,1,0]);assert.equal(s.status,'expired');assert.equal(s.winnerId,null);
 await db.exec('set role authenticated');await who(other);await assert.rejects(()=>db.query('select * from lupi_trivia_private.questions'));await assert.rejects(()=>rpc('trivia_state',[id]));await who(host);assert.equal((await rpc('trivia_state',[id])).status,'finished');
 await db.exec('reset role');
 const tie='66666666-6666-4666-8666-666666666666';await rpc('trivia_start',[tie,host,guest]);
 for(let r=1;r<=5;r++){await who(host);await rpc('trivia_answer',[tie,r,0]);await who(guest);s=await rpc('trivia_answer',[tie,r,0]);}
 assert.equal(s.status,'finished');assert.equal(s.winnerId,null);
 console.log('PASS: migration repeatable, shared questions, 5 rounds, secret answers, duplicate/stale answers, winner, tie, expiry, participant authorization, private tables.');
 await db.close();
})().catch(e=>{console.error(e);process.exit(1)});
