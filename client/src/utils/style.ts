const GRAY = '#C8D3D5';
const GRAY_BLUE = '#A4B8C4';
const WHITE = '#FFF';
const BLUE = '#00A7E1';
const DARK_BLUE = '#00171F';
const BLACK = '#000';

const BACKGROUND = DARK_BLUE;
const FONT_COLOR = WHITE;

export const IGetBackStyles = {
    GRAY: GRAY,
    GRAY_BLUE: GRAY_BLUE,
    WHITE: WHITE,
    BLUE: BLUE,
    DARK_BLUE: DARK_BLUE,
    BLACK: BLACK,
    globalStyle: {
        backgroundColor: BACKGROUND,
        color: FONT_COLOR,
        height: '100%',
        width: '100%'
    },
    navbarStyle: {
        navbarGlobal: {
            background: GRAY_BLUE,
            borderColor: BLACK
        }
    },
    inputBoxStyle: {
        padding: '10px',
        width: '70%',
        border: 'solid 1px #FFF',
        transition: 'box-shadow 0.3s, border 1.3s',
        color: 'black',
        borderRadius: '0.3em',
        margin: '2%'
    },
    buttonStyle: {
        submitButton: {
            background: GRAY_BLUE,
            display: 'inline-block',
            margin: '1%',
            borderRadius: 0,
            boxShadow: 'none',
            appearance: 'none',
            border: `solid 1px ${BLACK}`,
            paddingLeft: '10%',
            paddingRight: '10%',
            marginTop: '2%',
            fontSize: '1em'
        }
    }
};
