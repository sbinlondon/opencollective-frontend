import { randomEmail } from '../support/faker';

describe('Contribution Flow: Create profile', () => {
  it('Personal profile', () => {
    cy.visit('/apex/donate');

    // Go to CreateProfile
    cy.get('[data-cy="cf-content"] button')
      .contains('Join Free')
      .click();

    // Has TOS
    cy.contains('By joining, you agree to our Terms of Service and Privacy Policy.');
    cy.get('[data-cy="join-conditions"] a[href="/tos"]');
    cy.get('[data-cy="join-conditions"] a[href="/privacypolicy"]');

    // Test frontend validations
    cy.get('[data-cy="cf-content"] input[name=email]').type('Incorrect value');
    cy.get('[data-cy="cf-content"] button[type=submit]').click();
    cy.contains("Please include an '@' in the email address. 'Incorrectvalue' is missing an '@'.");

    // Test backend validations
    cy.get('[data-cy="cf-content"] input[name=email]').type('{selectall}Incorrect@value');
    cy.get('[data-cy="cf-content"] button[type=submit]').click();
    cy.contains('Validation error: Email must be valid');

    // Submit the form with correct values
    const email = randomEmail();
    cy.get('[data-cy="cf-content"] input[name=email]').type(`{selectall}${email}`);
    cy.get('[data-cy="cf-content"] button[type=submit]').click();
    cy.contains('Your magic link is on its way!');
    cy.contains(`We've sent it to ${email}.`);
  });

  it('Organization profile', () => {
    cy.visit('/apex/donate');

    // Go to CreateProfile
    cy.get('[data-cy="cf-content"] button')
      .contains('Join Free')
      .click();

    // Select "Create oganization"
    cy.get('[data-cy="cf-content"]')
      .contains('Create Organization Profile')
      .click();

    // Test frontend validations
    cy.get('[data-cy="cf-content"] input[name=orgName]').type('Test Organization');
    cy.get('[data-cy="cf-content"] input[name=email]').type('Incorrect value');
    cy.get('[data-cy="cf-content"] button[type=submit]').click();
    cy.contains("Please include an '@' in the email address. 'Incorrectvalue' is missing an '@'.");

    // Test backend validations
    cy.get('[data-cy="cf-content"] input[name=email]').type('{selectall}Incorrect@value');
    cy.get('[data-cy="cf-content"] button[type=submit]').click();
    cy.contains('Validation error: Email must be valid');

    // Submit the form with correct values
    const email = randomEmail();
    cy.get('[data-cy="cf-content"] input[name=email]').type(`{selectall}${email}`);
    cy.get('[data-cy="cf-content"] button[type=submit]').click();
    cy.contains('Your magic link is on its way!');
    cy.contains(`We've sent it to ${email}.`);
  });
});
