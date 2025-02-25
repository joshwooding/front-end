import { arrayOf, shape, string } from 'prop-types';
import ReactPlayer from 'react-player';
import { parse as parseXml } from 'fast-xml-parser';
import { getServerErrorMessage, ExternalAPI } from 'common/utils/api-utils';
import Head from 'components/head';
import Alert from 'components/Alert/Alert';
import HeroBanner from 'components/HeroBanner/HeroBanner';
import Card from 'components/Cards/Card/Card';
import Content from 'components/Content/Content';
import styles from './styles/podcast.css';

class Podcast extends React.Component {
  // We have atypical error handling because there exist errors thrown on nearly every request.
  static async getInitialProps() {
    const { data } = await ExternalAPI.get('https://operationcode.libsyn.com/rss');
    const { rss } = parseXml(data, {
      ignoreNameSpace: true,
      ignoreAttributes: false,
      attributeNamePrefix: '',
    });

    if (rss && rss.channel.item.length) {
      const episodes = rss.channel.item.map(({ image: { href }, link, title, description }) => ({
        image: href,
        name: title,
        source: link,
        story: description.replace(/(<p>|<\/p>)/g, ''),
      }));

      if (Array.isArray(episodes) && episodes.length !== 0) {
        // Successful
        return { episodes };
      }
    }

    // Request failed or RSS Feed is broken
    return { episodes: [], errorMessage: getServerErrorMessage() };
  }

  static propTypes = {
    episodes: arrayOf(shape({ image: string, name: string, source: string, story: string })),
    errorMessage: string,
  };

  static defaultProps = {
    episodes: [],
    errorMessage: '',
  };

  render() {
    const { episodes, errorMessage } = this.props;
    const pageTitle = 'Podcast';

    return (
      <>
        <Head title={pageTitle} />

        <HeroBanner title={pageTitle} />

        <Content
          columns={[
            <p>Come listen to some inspiring stories of our vets transitioning into tech!</p>,
            <div className={styles.podcastCards}>
              {errorMessage ? (
                <Alert type="error">{errorMessage}</Alert>
              ) : (
                episodes.map(({ name, image, source, story }) => {
                  /*
                   * Some episodes have multiple parts and are named like "${Name}, part 1".
                   * Some episodes are named "${Name} Interview"
                   *
                   * Parsing them in this manner ensures that the name of the interviewee is
                   * available and used for the image alt tag.
                   */
                  const interviewee = name.replace(/ interview/gi, '').split(',')[0];

                  return (
                    <Card data-testid="Podcast Card" className={styles.podcastCard} key={name}>
                      <h3>{interviewee}</h3>

                      <img src={image} alt={interviewee} className={styles.img} />

                      <ReactPlayer
                        url={source}
                        controls
                        width="80%"
                        height="65px"
                        config={{
                          file: {
                            attributes: {
                              preload: 'none',
                            },
                          },
                        }}
                      />

                      <p>{story}</p>
                    </Card>
                  );
                })
              )}
            </div>,
          ]}
        />
      </>
    );
  }
}

export default Podcast;
