import { languageMeta } from '../config/languages';
import './language-badge.scss';

/**
 * A small coloured tile ("C++", "Py", "JS") identifying a file's language,
 * so a list of files can be scanned by language at a glance.
 */
export const LanguageBadge = ({ language, size = 'md' }) => {
    const { label, short, color } = languageMeta(language);
    return (
        <span
            className={`lang-badge lang-badge--${size}`}
            style={{ '--lang': color }}
            role="img"
            aria-label={label}
            title={label}
        >
            {short}
        </span>
    );
};
