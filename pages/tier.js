import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import { get } from 'lodash';

import { withUser } from '../components/UserProvider';
import ErrorPage from '../components/ErrorPage';
import Page from '../components/Page';
import Loading from '../components/Loading';
import CollectiveThemeProvider from '../components/CollectiveThemeProvider';
import TierPageContent from '../components/tier-page';

/**
 * The main page to display collectives. Wrap route parameters and GraphQL query
 * to render `components/collective-page` with everything needed.
 */
class TierPage extends React.Component {
  static getInitialProps({ query: { collectiveSlug, tierId, tierSlug } }) {
    return { collectiveSlug, tierId: Number(tierId), tierSlug };
  }

  static propTypes = {
    tierId: PropTypes.number.isRequired,
    collectiveSlug: PropTypes.string.isRequired,
    data: PropTypes.object.isRequired, // from withData
    LoggedInUser: PropTypes.object, // from withUser
    tierSlug: PropTypes.string,
  };

  // See https://github.com/opencollective/opencollective/issues/1872
  shouldComponentUpdate(newProps) {
    if (get(this.props, 'data.Tier') && !get(newProps, 'data.Tier')) {
      return false;
    } else {
      return true;
    }
  }

  getPageMetaData(tier) {
    if (tier && tier.collective) {
      const collective = tier.collective;
      return {
        title: `${collective.name} - ${tier.name}`,
        description: tier.description || collective.description || collective.longDescription,
        twitterHandle: collective.twitterHandle || get(collective, 'parentCollective.twitterHandle'),
        image: collective.image || get(collective, 'parentCollective.image'),
        canonicalURL: `/${tier.collective.slug}/contribute/${tier.slug}-${tier.id}`,
      };
    } else {
      return {
        title: 'Tier',
        image: '/static/images/defaultBackgroundImage.png',
        canonicalURL: `/${this.props.collectiveSlug}/contribute/${this.props.tierSlug}-${this.props.tierId}`,
      };
    }
  }

  render() {
    const { data, LoggedInUser } = this.props;

    return !data || data.error ? (
      <ErrorPage data={data} />
    ) : (
      <Page {...this.getPageMetaData(data.Tier)}>
        {data.loading || !data.Tier || !data.Tier.collective ? (
          <Loading />
        ) : (
          <CollectiveThemeProvider collective={data.Tier.collective}>
            <TierPageContent
              LoggedInUser={LoggedInUser}
              collective={data.Tier.collective}
              tier={data.Tier}
              contributors={data.Tier.contributors}
              contributorsStats={data.Tier.stats.contributors}
            />
          </CollectiveThemeProvider>
        )}
      </Page>
    );
  }
}

const getTierData = graphql(gql`
  query TierPage($tierId: Int!) {
    Tier(id: $tierId) {
      id
      name
      slug
      description
      longDescription
      videoUrl
      goal
      currency
      interval
      endsAt

      stats {
        id
        totalDonated
        totalRecurringDonations
        contributors {
          id
          all
          collectives
          organizations
          users
        }
      }

      collective {
        id
        slug
        type
        name
        backgroundImage
        settings
        currency
        isArchived
        path
        host {
          id
        }
        stats {
          id
          updates
          balance
          transactions {
            id
            all
          }
        }
        admins: members(role: "ADMIN") {
          id
          role
          collective: member {
            id
            type
            slug
            name
            image
          }
        }
        parentCollective {
          id
          twitterHandle
          image
        }
      }

      contributors {
        id
        name
        roles
        isAdmin
        isCore
        isBacker
        isFundraiser
        since
        description
        publicMessage
        collectiveSlug
        totalAmountDonated
        type
        isIncognito
      }
    }
  }
`);

export default withUser(getTierData(TierPage));
