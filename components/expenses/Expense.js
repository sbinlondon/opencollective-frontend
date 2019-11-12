import React from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import { graphql } from 'react-apollo';

import { capitalize, formatCurrency, compose } from '../../lib/utils';
import colors from '../../lib/constants/colors';

import Avatar from '../Avatar';
import Link from '../Link';
import SmallButton from '../SmallButton';
import Moment from '../Moment';
import AmountCurrency from './AmountCurrency';
import ExpenseDetails from './ExpenseDetails';
import ExpenseNeedsTaxFormBadge from './ExpenseNeedsTaxFormBadge';
import ApproveExpenseBtn from './ApproveExpenseBtn';
import RejectExpenseBtn from './RejectExpenseBtn';
import PayExpenseBtn from './PayExpenseBtn';
import MarkExpenseAsUnpaidBtn from './MarkExpenseAsUnpaidBtn';
import EditPayExpenseFeesForm from './EditPayExpenseFeesForm';
import ConfirmationModal from '../ConfirmationModal';
import StyledButton from '../StyledButton';

class Expense extends React.Component {
  static propTypes = {
    expense: PropTypes.shape({
      id: PropTypes.number.isRequired,
      status: PropTypes.string.isRequired,
      updatedAt: PropTypes.string.isRequired,
      amount: PropTypes.number.isRequired,
      currency: PropTypes.string.isRequired,
      incurredAt: PropTypes.string.isRequired,
      category: PropTypes.string.isRequired,
      payoutMethod: PropTypes.string.isRequired,
      description: PropTypes.string,
      userTaxFormRequiredBeforePayment: PropTypes.bool,
      fromCollective: PropTypes.shape({
        id: PropTypes.number.isRequired,
        slug: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
      }),
      collective: PropTypes.shape({
        id: PropTypes.number.isRequired,
        slug: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        currency: PropTypes.string.isRequired,
        stats: PropTypes.shape({
          balance: PropTypes.number,
        }).isRequired,
      }),
    }).isRequired,
    collective: PropTypes.object,
    host: PropTypes.object,
    view: PropTypes.string, // "compact" for homepage (can't edit expense, don't show header), "summary" for list view, "details" for details view
    editable: PropTypes.bool,
    includeHostedCollectives: PropTypes.bool,
    LoggedInUser: PropTypes.object,
    allowPayAction: PropTypes.bool,
    lockPayAction: PropTypes.func,
    unlockPayAction: PropTypes.func,
    editExpense: PropTypes.func,
    unapproveExpense: PropTypes.func,
    refetch: PropTypes.func,
    intl: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      modified: false,
      expense: {},
      mode: undefined,
      showUnapproveModal: false,
    };

    this.save = this.save.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.toggleDetails = this.toggleDetails.bind(this);
    this.toggleEdit = this.toggleEdit.bind(this);
    this.messages = defineMessages({
      pending: { id: 'expense.pending', defaultMessage: 'pending' },
      paid: { id: 'expense.paid', defaultMessage: 'paid' },
      approved: { id: 'expense.approved', defaultMessage: 'approved' },
      rejected: { id: 'expense.rejected', defaultMessage: 'rejected' },
      closeDetails: {
        id: 'expense.closeDetails',
        defaultMessage: 'Close Details',
      },
      edit: { id: 'expense.edit', defaultMessage: 'edit' },
      cancelEdit: { id: 'expense.cancelEdit', defaultMessage: 'cancel edit' },
      viewDetails: {
        id: 'expense.viewDetails',
        defaultMessage: 'View Details',
      },
      'unapprove.modal.header': {
        id: 'unapprove.modal.header',
        defaultMessage: 'Unapprove Expense',
      },
      'unapprove.modal.body': {
        id: 'unapprove.modal.body',
        defaultMessage: 'Are you sure you want to unapprove this expense?',
      },
      no: { id: 'no', defaultMessage: 'No' },
      yes: { id: 'yes', defaultMessage: 'Yes' },
    });
    this.currencyStyle = {
      style: 'currency',
      currencyDisplay: 'symbol',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    };
  }

  toggleDetails() {
    this.setState({
      mode: this.state.mode === 'details' ? 'summary' : 'details',
    });
  }

  cancelEdit() {
    this.setState({ modified: false, mode: 'details' });
  }

  edit() {
    this.setState({ modified: false, mode: 'edit' });
  }

  toggleEdit() {
    this.state.mode === 'edit' ? this.cancelEdit() : this.edit();
  }

  handleChange(obj) {
    const newState = { ...this.state, modified: true, ...obj };
    this.setState(newState);
  }

  handleUnapproveExpense = async id => {
    try {
      await this.props.unapproveExpense(id);
      this.setState({ showUnapproveModal: false });
      await this.props.refetch();
    } catch (err) {
      console.error(err);
      this.setState({ showUnapproveModal: false });
    }
  };

  async save() {
    const expense = {
      id: this.props.expense.id,
      ...this.state.expense,
    };
    await this.props.editExpense(expense);
    this.setState({ modified: false, mode: 'details' });
  }

  render() {
    const { intl, collective, host, expense, includeHostedCollectives, LoggedInUser, editable } = this.props;

    if (!expense.fromCollective) {
      console.error('No FromCollective for expense', expense);
      return <div />;
    }

    const title = expense.description;
    const status = expense.status.toLowerCase();

    const view = this.props.view || 'summary';
    let { mode } = this.state;
    if (editable && LoggedInUser && !mode) {
      switch (expense.status) {
        case 'PENDING':
          mode = LoggedInUser.canApproveExpense(expense) && 'details';
          break;
        case 'APPROVED':
          mode = LoggedInUser.canPayExpense(expense) && 'details';
          break;
      }
    }
    mode = mode || view;

    const canPay = LoggedInUser && LoggedInUser.canPayExpense(expense) && expense.status === 'APPROVED';
    const canMarkExpenseAsUnpaid =
      LoggedInUser &&
      LoggedInUser.canPayExpense(expense) &&
      expense.status === 'PAID' &&
      expense.payoutMethod === 'other';

    const canReject =
      LoggedInUser &&
      LoggedInUser.canApproveExpense(expense) &&
      (expense.status === 'PENDING' ||
        (expense.status === 'APPROVED' &&
          (Date.now() - new Date(expense.updatedAt).getTime() < 60 * 1000 * 15 || // admin of collective can reject the expense for up to 10mn after approving it
            LoggedInUser.canEditCollective(collective.host))));

    let precision = 0;

    // Check if the remainder is not 0, this check is important in order to know the amount that needs precision
    // i.e display $10.21 as $10.21 instead of $10
    if ((expense.amount / 100) % 1 !== 0) {
      precision = 2;
    }

    const canApprove =
      LoggedInUser &&
      LoggedInUser.canApproveExpense(expense) &&
      (expense.status === 'PENDING' ||
        (expense.status === 'REJECTED' && Date.now() - new Date(expense.updatedAt).getTime() < 60 * 1000 * 15)); // we can approve an expense for up to 10mn after rejecting it

    return (
      <div className={`expense ${status} ${this.state.mode}View`}>
        <style jsx>
          {`
            .expense {
              width: 100%;
              margin: 0.5em 0;
              padding: 0.5em;
              transition: max-height 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
              overflow: hidden;
              position: relative;
              display: flex;
            }
            .ExpenseId {
              color: ${colors.gray};
              margin-left: 0.5rem;
            }
            .expense.detailsView {
              background-color: #fafafa;
            }
            a {
              cursor: pointer;
            }
            .fromCollective {
              float: left;
              margin-right: 1.6rem;
            }
            .body {
              font-size: 1.4rem;
              width: 100%;
            }
            .description {
              text-overflow: ellipsis;
              white-space: nowrap;
              overflow: hidden;
              display: block;
            }
            .meta {
              color: #919599;
              font-size: 1.2rem;
            }
            .meta .metaItem {
              margin: 0 0.2rem;
            }
            .meta .collective {
              margin-right: 0.2rem;
            }
            .amount .balance {
              font-size: 1.2rem;
              color: #919599;
            }
            .amount {
              margin-left: 0.5rem;
              text-align: right;
              font-size: 1.5rem;
              font-weight: 300;
            }
            .rejected .status {
              color: #e21a60;
            }

            .approved .status {
              color: #72ce00;
            }

            .status {
              text-transform: uppercase;
            }

            .actions > div {
              align-items: flex-end;
              display: flex;
              flex-wrap: wrap;
              margin: 0.5rem 0;
            }

            .actions .leftColumn {
              width: 72px;
              margin-right: 1rem;
              float: left;
            }
            .expenseActions {
              display: flex;
            }
            .expenseActions :global(> div) {
              margin-right: 0.5rem;
            }

            @media (max-width: 600px) {
              .expense {
                max-height: 50rem;
                padding: 2rem 0.5rem;
              }
              .expense.detailsView {
                max-height: 45rem;
              }
              .details {
                max-height: 30rem;
              }
            }
          `}
        </style>
        <style jsx global>
          {`
            .expense .actions > div > div {
              margin-right: 0.5rem;
            }

            @media screen and (max-width: 700px) {
              .expense .PayExpenseBtn ~ .RejectExpenseBtn {
                flex-grow: 1;
              }
              .expense .SmallButton {
                flex-grow: 1;
                margin-top: 1rem;
              }
              .expense .SmallButton button {
                width: 100%;
              }
            }
          `}
        </style>

        <div className="fromCollective">
          <Link
            route="collective"
            params={{ slug: expense.fromCollective.slug }}
            title={expense.fromCollective.name}
            passHref
          >
            <Avatar
              collective={expense.fromCollective}
              key={expense.fromCollective.id}
              radius={40}
              className="noFrame"
            />
          </Link>
        </div>
        <div className="body">
          <div className="header">
            <div className="amount pullRight">
              <AmountCurrency amount={-expense.amount} currency={expense.currency} precision={precision} />
            </div>
            <div className="description">
              <Link route={`/${collective.slug}/expenses/${expense.id}`} title={capitalize(title)}>
                {capitalize(title)}
                {view !== 'compact' && <span className="ExpenseId">#{expense.id}</span>}
              </Link>
            </div>
            <div className="meta">
              <Moment relative={true} value={expense.incurredAt} />
              {' | '}
              {includeHostedCollectives && expense.collective && (
                <span className="collective">
                  <Link route={`/${expense.collective.slug}`}>{expense.collective.slug}</Link> (balance:{' '}
                  {formatCurrency(expense.collective.stats.balance, expense.collective.currency)}){' | '}
                </span>
              )}
              <span className="status">{intl.formatMessage(this.messages[status])}</span>
              {' | '}
              {editable && LoggedInUser && LoggedInUser.canEditExpense(expense) && (
                <ExpenseNeedsTaxFormBadge isTaxFormRequired={expense.userTaxFormRequiredBeforePayment} />
              )}
              <span className="metaItem">
                <Link
                  route="expenses"
                  params={{
                    collectiveSlug: expense.collective.slug,
                    filter: 'categories',
                    value: expense.category,
                  }}
                  scroll={false}
                >
                  {capitalize(expense.category)}
                </Link>
              </span>
              {editable && LoggedInUser && LoggedInUser.canEditExpense(expense) && (
                <span>
                  {' | '}
                  <a className="toggleEditExpense" onClick={this.toggleEdit}>
                    {intl.formatMessage(this.messages[`${mode === 'edit' ? 'cancelEdit' : 'edit'}`])}
                  </a>
                </span>
              )}
              {mode !== 'edit' && view === 'summary' && (
                <span>
                  {' | '}
                  <a className="toggleDetails" onClick={this.toggleDetails}>
                    {intl.formatMessage(this.messages[`${mode === 'details' ? 'closeDetails' : 'viewDetails'}`])}
                  </a>
                </span>
              )}
            </div>
          </div>

          <ExpenseDetails
            LoggedInUser={LoggedInUser}
            expense={expense}
            collective={collective}
            onChange={expense => this.handleChange({ expense })}
            mode={mode}
          />
          {this.state.showUnapproveModal && (
            <ConfirmationModal
              show={this.state.showUnapproveModal}
              header={intl.formatMessage(this.messages['unapprove.modal.header'])}
              body={intl.formatMessage(this.messages['unapprove.modal.body'])}
              onClose={() => this.setState({ showUnapproveModal: false })}
              cancelLabel={intl.formatMessage(this.messages['no'])}
              cancelHandler={() => this.setState({ showUnapproveModal: false })}
              continueLabel={intl.formatMessage(this.messages['yes'])}
              continueHandler={() => this.handleUnapproveExpense(expense.id)}
            />
          )}
          {editable && (
            <div className="actions">
              {mode === 'edit' && this.state.modified && (
                <div>
                  <div className="leftColumn" />
                  <div className="rightColumn">
                    <SmallButton className="primary save" onClick={this.save}>
                      <FormattedMessage id="expense.save" defaultMessage="save" />
                    </SmallButton>
                  </div>
                </div>
              )}
              {mode !== 'edit' && (canPay || canApprove || canReject || canMarkExpenseAsUnpaid) && (
                <div className="manageExpense">
                  {canPay && expense.payoutMethod === 'other' && (
                    <EditPayExpenseFeesForm
                      canEditPlatformFee={LoggedInUser.isRoot()}
                      currency={collective.currency}
                      onChange={fees => this.handleChange({ fees })}
                    />
                  )}
                  <div className="expenseActions">
                    {canPay && (
                      <PayExpenseBtn
                        expense={expense}
                        collective={collective}
                        host={host}
                        {...this.state.fees}
                        refetch={this.props.refetch}
                        disabled={!this.props.allowPayAction}
                        lock={this.props.lockPayAction}
                        unlock={this.props.unlockPayAction}
                      />
                    )}
                    {canPay && (
                      <StyledButton mr={2} onClick={() => this.setState({ showUnapproveModal: true })}>
                        <FormattedMessage id="expense.unapprove.btn" defaultMessage="Unapprove" />
                      </StyledButton>
                    )}
                    {canMarkExpenseAsUnpaid && <MarkExpenseAsUnpaidBtn refetch={this.props.refetch} id={expense.id} />}
                    {canApprove && <ApproveExpenseBtn refetch={this.props.refetch} id={expense.id} />}
                    {canReject && <RejectExpenseBtn refetch={this.props.refetch} id={expense.id} />}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
}

const unapproveExpense = graphql(
  gql`
    mutation unapproveExpense($id: Int!) {
      unapproveExpense(id: $id) {
        id
        status
      }
    }
  `,
  {
    props: ({ mutate }) => ({
      unapproveExpense: async id => {
        return await mutate({ variables: { id } });
      },
    }),
  },
);

const editExpense = graphql(
  gql`
    mutation editExpense($expense: ExpenseInputType!) {
      editExpense(expense: $expense) {
        id
        description
        amount
        attachment
        category
        privateMessage
        payoutMethod
        status
      }
    }
  `,
  {
    props: ({ mutate }) => ({
      editExpense: async expense => {
        return await mutate({ variables: { expense } });
      },
    }),
  },
);

const addMutations = compose(unapproveExpense, editExpense);

export default injectIntl(addMutations(Expense));
