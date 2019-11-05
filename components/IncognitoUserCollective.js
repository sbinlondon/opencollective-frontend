import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Header from './Header';
import Body from './Body';
import Footer from './Footer';
import { IncognitoAvatar } from './Avatar';
import { defineMessages, injectIntl } from 'react-intl';
import { Flex } from '@rebass/grid';

class UserCollective extends React.Component {
  static propTypes = {
    LoggedInUser: PropTypes.object,
    query: PropTypes.object,
    intl: PropTypes.object.isRequired,
    message: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.classNames = ['UserCollectivePage'];
    this.messages = defineMessages({
      'incognito.title': { id: 'UserCollective.incognito.title', defaultMessage: 'Incognito user' },
      'incognito.description': {
        id: 'UserCollective.incognito.description',
        defaultMessage: 'This user decided to remain incognito',
      },
    });
  }

  render() {
    const { intl } = this.props;

    return (
      <div className={classNames('UserCollectivePage')}>
        <style jsx>
          {`
            h1 {
              font-size: 2rem;
            }
          `}
        </style>

        <Header
          title={intl.formatMessage(this.messages['incognito.title'])}
          description={intl.formatMessage(this.messages['incognito.description'])}
          metas={{ robots: 'noindex' }}
        />

        <Body>
          <Flex justifyContent="center" alignItems="center" flexDirection="column" my={4}>
            <IncognitoAvatar />
            <h1>{intl.formatMessage(this.messages['incognito.title'])}</h1>
            <p>{intl.formatMessage(this.messages['incognito.description'])}</p>
            <p>¯\_(ツ)_/¯</p>
          </Flex>
        </Body>
        <Footer />
      </div>
    );
  }
}

export default injectIntl(UserCollective);
