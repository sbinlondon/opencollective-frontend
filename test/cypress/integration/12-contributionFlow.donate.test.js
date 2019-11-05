import mockRecaptcha from '../mocks/recaptcha';
import { CreditCards } from '../../stripe-helpers';

const visitParams = { onBeforeLoad: mockRecaptcha };

describe('Contribution Flow: Donate', () => {
  it('Can donate as new user', () => {
    // Mock clock so we can check next contribution date in a consistent way
    cy.clock(Date.parse('2042/05/25'));

    const userParams = { firstName: 'Donate', lastName: 'Tester' };
    cy.signup({ user: userParams, redirect: '/apex/donate', visitParams }).then(user => {
      // ---- Step 1: Select profile ----
      // Personnal account must be the first entry, and it must be checked
      cy.contains('#contributeAs > label:first', `${user.firstName} ${user.lastName}`);
      cy.contains('#contributeAs > label:first', `Personal account - ${user.email}`);
      cy.get('#contributeAs > label:first input[type=radio][name=contributeAs]').should('be.checked');

      // User profile is shown on step, all other steps must be disabled
      cy.get('.step-contributeAs').contains(`${user.firstName} ${user.lastName}`);
      cy.checkStepsProgress({ enabled: 'contributeAs', disabled: ['details', 'payment'] });

      cy.contains('Next step').click();

      // ---- Step 2: Contribute details ----
      cy.checkStepsProgress({ enabled: ['contributeAs', 'details'], disabled: 'payment' });

      // Has default amount selected
      cy.get('#amount button.selected').should('exist');

      // Change amount
      cy.get('input[type=number][name=custom-amount]').type('{selectall}1337');
      cy.tick(1000); // Update details is debounced, we need to tick the clock to trigger update
      cy.contains('.step-details', '$1,337.00');

      // Change frequency - monthly
      cy.get('#interval').click();
      cy.contains('[data-cy="select-option"]', 'Monthly').click();
      cy.tick(1000); // Update details is debounced, we need to tick the clock to trigger update
      cy.contains('.step-details', '$1,337.00 per month');
      // next charge in 2 months time, first day, because it was made on or after 15th.
      cy.contains('Next charge: Jul 1, 2042');

      // Change frequency - yearly
      cy.get('#interval').click();
      cy.contains('[data-cy="select-option"]', 'Yearly').click();
      cy.tick(1000); // Update details is debounced, we need to tick the clock to trigger update
      cy.contains('.step-details', '$1,337.00 per year');
      cy.contains('Next charge: May 1, 2043');

      cy.contains('Next step').click();

      // ---- Step 3: Payment ----
      cy.checkStepsProgress({ enabled: ['contributeAs', 'details', 'payment'] });
      // As this is a new account, not payment method is configured yet so
      // we should have the credit card form selected by default.
      cy.get('input[type=checkbox][name=save]').should('be.checked');
      cy.wait(1000); // Wait for stripe to be loaded

      // Ensure we display errors
      cy.fillStripeInput({ card: { creditCardNumber: 123 } });
      cy.contains('button', 'Make contribution').click();
      cy.contains('Your card number is incomplete.');

      // Submit with valid credit card
      cy.fillStripeInput();
      cy.contains('button', 'Make contribution').click();

      // ---- Final: Success ----
      cy.get('#page-order-success', { timeout: 20000 }).contains('$1,337.00 USD / yr.');
      cy.contains(`${user.firstName} ${user.lastName} is now a backer of APEX!`);

      // ---- Let's go back ---
      cy.go('back');

      // Steps should be reset
      cy.checkStepsProgress({ enabled: 'contributeAs', disabled: ['details', 'payment'] });

      // Previous credit card should be added to the account
      cy.reload(visitParams).reload(visitParams);
      cy.contains('Next step').click();
      cy.contains('Next step').click();
      cy.contains('#PaymentMethod label:first', 'VISA ****');
      cy.get('#PaymentMethod label:first input[type=radio][name=PaymentMethod]').should('be.checked');

      // Submit a new order with existing card
      cy.contains('button', 'Make contribution').click();
      cy.get('#page-order-success', { timeout: 20000 }).contains('Woot woot!');
    });
  });

  it('Can donate as new organization', () => {
    cy.signup({ redirect: '/apex/donate', visitParams }).then(() => {
      cy.contains('#contributeAs > label', 'A new organization').click();

      // Name must be shown on step
      cy.get('#contributeAs input[name=name]').type('Evil Corp');
      cy.get('.step-contributeAs').contains('Evil Corp');

      // Fill form
      cy.get('#contributeAs input[name=website]').type('https://www.youtube.com/watch?v=oHg5SJYRHA0');
      cy.get('#contributeAs input[name=githubHandle]').type('test');
      cy.get('#contributeAs input[name=twitterHandle]').type('test');

      // Submit form
      cy.contains('button:not([disabled])', 'Next step').click();
      cy.contains('button:not([disabled])', 'Next step').click();
      cy.wait(2000);
      cy.fillStripeInput();
      cy.contains('button', 'Make contribution').click();

      // ---- Final: Success ----
      cy.get('#page-order-success', { timeout: 20000 }).contains('$20.00 USD');
      cy.contains('Evil Corp is now a backer of APEX!');
    });
  });

  it('Forces params if given in URL', () => {
    cy.signup({ redirect: '/apex/donate/42/year', visitParams }).then(() => {
      cy.clock(Date.parse('2042/05/25'));
      cy.contains('button', 'Next step').click();

      // Second step should be payment method select
      cy.checkStepsProgress({ enabled: ['contributeAs', 'payment'] });
      cy.wait(1000); // Wait for stripe to be loaded
      cy.fillStripeInput();
      cy.contains('Next step').click();

      // Should display the contribution details
      cy.getByDataCy('contribution-details').then($container => {
        const text = $container[0].innerText;
        expect(text).to.contain('Contribution details:');
        expect(text).to.contain('You’ll contribute with the amount of $42.00 yearly.');
        expect(text).to.contain('First charge: Today');
        expect(text).to.contain('Next charge: May 1, 2043');
      });

      // Submit order
      cy.contains('button', 'Make contribution').click();

      // Check success page
      cy.get('#page-order-success', { timeout: 20000 }).contains('$42.00 USD / yr.');
      cy.contains("You're now a backer of APEX!");
    });
  });

  it('works with 3D secure', () => {
    cy.signup({ redirect: '/apex/donate/42/year', visitParams });
    cy.contains('button', 'Next step').click();
    cy.checkStepsProgress({ enabled: ['contributeAs', 'payment'] });
    cy.wait(1000); // Wait for stripe to be loaded

    cy.fillStripeInput({ card: CreditCards.CARD_3D_SECURE });
    cy.contains('button', 'Make contribution').click();
    cy.wait(10000); // 3D secure popup takes some time to appear

    // Using 3D secure should trigger an iframe
    const iframeSelector = 'iframe[name^="__privateStripeFrame"]';

    // Rejecting the validation should produce an error
    cy.get(iframeSelector).then($3dSecureIframe => {
      const $challengeIframe = $3dSecureIframe.contents().find('body iframe#challengeFrame');
      const cyChallenge = cy.wrap($challengeIframe.contents().find('body'));
      cyChallenge.find('#test-source-fail-3ds').click();
    });
    cy.contains(
      'We are unable to authenticate your payment method. Please choose a different payment method and try again.',
    );

    // Refill stripe input to avoid using the same token twice
    cy.fillStripeInput({ card: CreditCards.CARD_3D_SECURE });

    // Re-trigger the popup
    cy.contains('button', 'Make contribution').click();
    cy.wait(7500); // 3D secure popup takes some time to appear

    // Approving the validation should create the order
    cy.get(iframeSelector).then($3dSecureIframe => {
      const $challengeIframe = $3dSecureIframe.contents().find('body iframe#challengeFrame');
      const cyChallenge = cy.wrap($challengeIframe.contents().find('body'));
      cyChallenge.find('#test-source-authorize-3ds').click();
    });

    cy.contains("You're now a backer of APEX!", { timeout: 15000 });
  });
});
