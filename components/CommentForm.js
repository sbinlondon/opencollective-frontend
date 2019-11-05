import React from 'react';
import PropTypes from 'prop-types';
import { get, pick } from 'lodash';
import { defineMessages, FormattedMessage, FormattedDate } from 'react-intl';
import InputField from './InputField';
import SmallButton from './SmallButton';
import Avatar from './Avatar';
import Link from './Link';
import MessageBox from './MessageBox';

/**
 * Component to render for for **new** comments. Comment Edit form is created
 * with an `InputField` (see `opencollective-frontend/components/Comment.js`).
 */
class CommentForm extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    LoggedInUser: PropTypes.object,
    notice: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    onChange: PropTypes.func,
    onSubmit: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);

    this.messages = defineMessages({
      paypal: {
        id: 'comment.payoutMethod.paypal',
        defaultMessage: 'PayPal ({paypalEmail})',
      },
      // 'manual': { id: 'comment.payoutMethod.donation', defaultMessage: 'Consider as donation' },
      other: {
        id: 'comment.payoutMethod.manual',
        defaultMessage: 'Other (give instructions)',
      },
    });

    this.state = { comment: {}, error: null };
  }

  async onSubmit() {
    this.setState({ error: null });
    try {
      const comment = await this.props.onSubmit(pick(this.state.comment, ['html']));
      if (comment) {
        const newEmptyComment = { id: comment.id++ };
        this.setState({ comment: newEmptyComment });
      }
    } catch (e) {
      this.setState({ error: e });
    }
  }

  handleChange(attr, value) {
    const comment = {
      ...this.state.comment,
      [attr]: value,
    };
    this.setState({ comment });
    this.props.onChange && this.props.onChange(comment);
  }

  render() {
    const { LoggedInUser, notice } = this.props;
    if (!LoggedInUser) return <div />;

    const comment = {
      createdAt: new Date(),
      fromCollective: {
        id: LoggedInUser.collective.id,
        slug: LoggedInUser.collective.slug,
        name: LoggedInUser.collective.name,
        image: LoggedInUser.image,
      },
    };

    return (
      <div className={'CommentForm'}>
        <style jsx>
          {`
            .CommentForm {
              font-size: 1.2rem;
              overflow: hidden;
              margin: 0.5rem;
              padding: 0.5rem;
            }
            .fromCollective {
              float: left;
              margin-right: 1rem;
            }
            .meta {
              color: #919599;
              font-size: 1.2rem;
            }
            .body {
              overflow: hidden;
            }
            .actions {
              display: flex;
              align-items: center;
            }
            .notice {
              color: #525866;
              font-size: 12px;
              margin-left: 1rem;
            }
          `}
        </style>

        <div className="fromCollective">
          <Link
            route="collective"
            params={{ slug: comment.fromCollective.slug }}
            title={comment.fromCollective.name}
            passHref
          >
            <Avatar collective={comment.fromCollective} key={comment.fromCollective.id} radius={40} />
          </Link>
        </div>
        <div className="body">
          <div className="header">
            <div className="meta">
              <span className="createdAt">
                <FormattedDate value={comment.createdAt} day="numeric" month="numeric" />
              </span>{' '}
              |&nbsp;
              <span className="metaItem">
                <Link route={`/${comment.fromCollective.slug}`}>{comment.fromCollective.name}</Link>
              </span>
            </div>
            <div className="description">
              <div className="comment">
                <InputField
                  name="comment-new"
                  type="html"
                  value={get(this.state, 'comment.html', '')}
                  onChange={value => this.handleChange('html', value)}
                  className="small"
                />
              </div>
              {this.state.error && (
                <MessageBox type="error" withIcon mb={2}>
                  {this.state.error.toString()}
                </MessageBox>
              )}
              <div className="actions">
                <SmallButton className="primary save" onClick={this.onSubmit}>
                  <FormattedMessage id="comment.btn" defaultMessage="Comment" />
                </SmallButton>
                {notice && <div className="notice">{notice}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default CommentForm;
