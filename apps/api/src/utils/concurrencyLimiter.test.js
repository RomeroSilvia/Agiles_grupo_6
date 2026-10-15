import { describe, it, expect } from 'vitest';
import { createConcurrencyLimiter } from './concurrencyLimiter.js';

function crearTareaControlada() {
  let terminar;
  const promesa = new Promise((resolve) => {
    terminar = resolve;
  });
  return { promesa, terminar };
}

describe('createConcurrencyLimiter', () => {
  it('no ejecuta más tareas a la vez que el máximo', async () => {
    const limitar = createConcurrencyLimiter(2);
    const tareas = [crearTareaControlada(), crearTareaControlada(), crearTareaControlada()];
    let enCurso = 0;
    let maximoEnCurso = 0;

    const resultados = tareas.map(({ promesa }, indice) =>
      limitar(async () => {
        enCurso += 1;
        maximoEnCurso = Math.max(maximoEnCurso, enCurso);
        await promesa;
        enCurso -= 1;
        return indice;
      }),
    );

    await Promise.resolve();
    expect(enCurso).toBe(2);

    tareas.forEach(({ terminar }) => terminar());

    await expect(Promise.all(resultados)).resolves.toEqual([0, 1, 2]);
    expect(maximoEnCurso).toBe(2);
  });

  it('propaga el error de una tarea sin frenar las siguientes', async () => {
    const limitar = createConcurrencyLimiter(1);

    const fallida = limitar(() => Promise.reject(new Error('caída')));
    const siguiente = limitar(() => Promise.resolve('ok'));

    await expect(fallida).rejects.toThrow('caída');
    await expect(siguiente).resolves.toBe('ok');
  });
});
