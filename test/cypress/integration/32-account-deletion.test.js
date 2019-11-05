import mockRecaptcha from '../mocks/recaptcha';

describe('Account Deletion', () => {
  it('Should delete collective', () => {
    cy.login().then(() => {
      // Create a new collective
      cy.createCollective({ type: 'COLLECTIVE' }).then(collective => {
        const collectiveSlug = collective.slug;
        cy.visit(`/${collectiveSlug}/edit/advanced`);
        cy.contains('button', 'Delete this collective', { timeout: 15000 }).click();
        cy.get('[data-cy=delete]').click();
        cy.wait(1000);
        cy.location().should(location => {
          expect(location.search).to.eq('?type=COLLECTIVE');
        });
        cy.contains('h1', 'Your collective has been deleted.');
      });
    });
  });

  it('Should delete user', () => {
    const userParams = { firstName: 'New', lastName: 'Tester' };
    const visitParams = { onBeforeLoad: mockRecaptcha };
    cy.signup({ user: userParams, visitParams }).then(user => {
      cy.visit(`/${user.username}/edit/advanced`);
      cy.contains('button', 'Delete this account').click();
      cy.get('[data-cy=delete]').click();
      cy.wait(1000);
      cy.location().should(location => {
        expect(location.search).to.eq('?type=USER');
      });
      cy.contains('h1', 'Your account has been deleted.');
    });
  });
});
