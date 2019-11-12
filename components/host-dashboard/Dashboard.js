import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { Flex } from '@rebass/grid';
import { FormattedMessage } from 'react-intl';

import ExpensesWithData from '../expenses/ExpensesWithData';
import OrdersWithData from '../expenses/OrdersWithData';
import ExpensesStatsWithData from '../expenses/ExpensesStatsWithData';

import MessageBox from '../MessageBox';
import { H5 } from '../Text';
import Loading from '../Loading';
import HostDashboardActionsBanner from './HostDashboardActionsBanner';
import { withUser } from '../UserProvider';
import {
  getFromLocalStorage,
  setLocalStorage,
  LOCAL_STORAGE_KEYS,
  removeFromLocalStorage,
} from '../../lib/local-storage';

class HostDashboard extends React.Component {
  static propTypes = {
    hostCollectiveSlug: PropTypes.string, // for addData
    view: PropTypes.oneOf(['expenses', 'donations']).isRequired,
    LoggedInUser: PropTypes.object,
    data: PropTypes.object, // from addData
  };

  constructor(props) {
    super(props);
    this.state = { selectedCollective: null, expensesFilters: null };
  }

  componentDidMount() {
    this.restoreFilterPreferences();
  }

  pickCollective(selectedCollective) {
    this.setState({ selectedCollective });
  }

  saveFilterPreferences() {
    const { selectedCollective, expensesFilters } = this.state;
    setLocalStorage(
      LOCAL_STORAGE_KEYS.HOST_DASHBOARD_FILTER_PREFERENCES,
      JSON.stringify({
        selectedCollective,
        expensesFilters,
      }),
    );
  }

  restoreFilterPreferences() {
    let filterPreferences = getFromLocalStorage(LOCAL_STORAGE_KEYS.HOST_DASHBOARD_FILTER_PREFERENCES);
    if (filterPreferences) {
      filterPreferences = JSON.parse(filterPreferences);
      this.setState({ ...filterPreferences }, () => {
        removeFromLocalStorage(LOCAL_STORAGE_KEYS.HOST_DASHBOARD_FILTER_PREFERENCES);
      });
    }
  }

  renderExpenses(selectedCollective, includeHostedCollectives) {
    const { LoggedInUser, data } = this.props;
    const host = data.Collective;

    return (
      <Fragment>
        <div id="expenses" className="col first center-block">
          <div className="header">
            <H5 my={3}>
              <FormattedMessage id="host.expenses.title" defaultMessage="Expenses" />
            </H5>
          </div>
          <ExpensesWithData
            collective={selectedCollective}
            host={host}
            includeHostedCollectives={includeHostedCollectives}
            LoggedInUser={LoggedInUser}
            hasFilters
            filters={this.state.expensesFilters}
            onFiltersChange={expensesFilters => this.setState({ expensesFilters })}
            editable={true}
          />
        </div>
        {this.state.selectedCollective && (
          <div className="second col pullRight">
            <ExpensesStatsWithData slug={selectedCollective.slug} />
          </div>
        )}
      </Fragment>
    );
  }

  renderDonations(selectedCollective, includeHostedCollectives) {
    const { LoggedInUser } = this.props;
    return (
      <div id="orders" className="col center-block">
        <div className="header">
          <H5 my={3}>
            <FormattedMessage
              id="collective.orders.title"
              values={{ n: this.totalOrders }}
              defaultMessage="Financial Contributions"
            />
          </H5>
        </div>
        <OrdersWithData
          collective={selectedCollective}
          includeHostedCollectives={includeHostedCollectives}
          filters={true}
          LoggedInUser={LoggedInUser}
        />
      </div>
    );
  }

  render() {
    const { LoggedInUser, data, view } = this.props;

    if (data.loading) {
      return (
        <Flex py={5} justifyContent="center">
          <Loading />
        </Flex>
      );
    } else if (!data.Collective) {
      return (
        <MessageBox my={5} type="error" withIcon>
          <FormattedMessage id="notFound" defaultMessage="Not found" />
        </MessageBox>
      );
    }

    const host = data.Collective;
    const selectedCollective = this.state.selectedCollective || host;
    const includeHostedCollectives = selectedCollective.id === host.id;

    return (
      <div className="HostDashboard">
        <style jsx>
          {`
            .col.side {
              width: 100%;
              min-width: 20rem;
              max-width: 25%;
              margin-left: 5rem;
            }

            .col.large {
              margin-left: 6rem;
              min-width: 30rem;
              width: 50%;
              max-width: 75%;
            }
            .columns {
              display: flex;
              max-width: 1080px;
            }
            .col {
              width: 50%;
              max-width: 488px;
              min-width: 300px;
            }
            .col.first {
              margin-right: 104px;
            }
            .col .header {
              display: flex;
              align-items: baseline;
              justify-content: space-between;
            }
            h2 {
              line-height: 24px;
              color: black;
              font-weight: 500;
              font-size: 2rem;
              margin-bottom: 4.8rem;
            }
            @media (max-width: 600px) {
              .columns {
                flex-direction: column-reverse;
              }
              .columns .col {
                max-width: 100%;
              }
            }
          `}
        </style>
        {LoggedInUser && (
          <HostDashboardActionsBanner
            host={host}
            LoggedInUser={LoggedInUser}
            onChange={selectedCollective => this.pickCollective(selectedCollective)}
            defaultSelectedCollective={this.state.selectedCollective}
            saveFilterPreferences={() => this.saveFilterPreferences()}
          />
        )}
        <div className="content">
          <div className="columns">
            {view === 'expenses' && this.renderExpenses(selectedCollective, includeHostedCollectives)}
            {view === 'donations' && this.renderDonations(selectedCollective, includeHostedCollectives)}
          </div>
        </div>
      </div>
    );
  }
}

const getDataQuery = gql`
  query Collective($hostCollectiveSlug: String) {
    Collective(slug: $hostCollectiveSlug) {
      id
      slug
      name
      isHost
      currency
      paymentMethods(includeOrganizationCollectivePaymentMethod: true) {
        id
        uuid
        service
        name
        createdAt
        expiryDate
        balance
        currency
      }
      stats {
        id
        collectives {
          id
          hosted
        }
      }
    }
  }
`;

export const addData = graphql(getDataQuery, {
  options(props) {
    return {
      variables: {
        hostCollectiveSlug: props.hostCollectiveSlug,
      },
    };
  },
});

export default withUser(addData(HostDashboard));
