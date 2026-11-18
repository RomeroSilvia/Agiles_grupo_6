import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import logoPlanB from '../../assets/logo-plan-b.png';
import { PLAN_B_URL } from '../../config/app.config.js';
import { InvitacionPlanB } from './InvitacionPlanB.jsx';

describe('InvitacionPlanB', () => {
  it('muestra la invitación con un enlace seguro y el logo de Plan B', () => {
    render(<InvitacionPlanB />);

    const enlace = screen.getByRole('link', { name: /mejor con amigos: ir a Plan B/ });
    expect(enlace).toHaveTextContent(
      'Los planes que te ofrecemos en Streamly disfrutalos mejor con amigos:',
    );
    expect(enlace).toHaveAttribute('href', PLAN_B_URL);
    expect(enlace).toHaveAttribute('target', '_blank');
    expect(enlace).toHaveAttribute('rel', 'noopener noreferrer');
    const logo = within(enlace).getByRole('img', { name: 'Plan B' });
    expect(logo).toBeVisible();
    expect(logo).toHaveAttribute('src', logoPlanB);
  });
});
