import { Stage, Container, Graphics, Text } from '@pixi/react';
import { useEffect, useState } from 'react';

const FIELD_WIDTH = 800;  // px
const FIELD_HEIGHT = 400;

const FutsalField = ({ players, ball }) => {
  return (
    <Stage width={FIELD_WIDTH} height={FIELD_HEIGHT} options={{ backgroundColor: 0x0b3d91 }}>
      <Container x={0} y={0}>
        {/* Cancha */}
        <Graphics
          draw={g => {
            g.clear();
            g.lineStyle(4, 0xffffff, 1);
            g.drawRect(0, 0, FIELD_WIDTH, FIELD_HEIGHT);
            g.moveTo(FIELD_WIDTH / 2, 0);
            g.lineTo(FIELD_WIDTH / 2, FIELD_HEIGHT);
            g.drawCircle(FIELD_WIDTH / 2, FIELD_HEIGHT / 2, 60);
          }}
        />
        
        {/* Jugadores */}
        {players.map(p => (
          <Graphics
            key={p.id}
            draw={g => {
              g.clear();
              g.beginFill(p.team === 'user' ? 0x4caf50 : 0xf44336);
              g.drawCircle(0, 0, 10);
              g.endFill();
            }}
            x={p.x}
            y={p.y}
          />
        ))}

        {/* Balón */}
        <Graphics
          draw={g => {
            g.clear();
            g.beginFill(0xffffff);
            g.drawCircle(0, 0, 6);
            g.endFill();
          }}
          x={ball.x}
          y={ball.y}
        />
      </Container>
    </Stage>
  );
};

export default FutsalField;
