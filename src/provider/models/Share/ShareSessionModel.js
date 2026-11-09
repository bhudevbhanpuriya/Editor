import { useContext, useRef, useState } from 'react';
import { ModelContext } from '../../ModelProvider';
import { ModelShell } from '../ModelShell';
import { useNotify } from '../../NotificationProvider';
import { shareUrlFor } from '../../../screens/PlaygroundScreen/ShareButton';

export const ShareSessionModel = () => {
    const { closeModel, modelPayload } = useContext(ModelContext);
    const notify = useNotify();
    const inputRef = useRef(null);
    const [copied, setCopied] = useState(false);

    const url = shareUrlFor(modelPayload?.roomId);

    const copy = async () => {
        try {
            // Clipboard API needs a secure context; select-and-copy is the
            // fallback on plain http, which is how this runs locally.
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
            } else {
                inputRef.current?.select();
                document.execCommand('copy');
            }
            setCopied(true);
            notify('Link copied', 'success');
        } catch (e) {
            inputRef.current?.select();
            notify('Could not copy automatically — the link is selected, press Ctrl+C.', 'error');
        }
    };

    return (
        <ModelShell
            title="Share this session"
            submitLabel="Done"
            onSubmit={closeModel}
        >
            <p className="confirm-message">
                Anyone with this link can open the file and edit it live with you.
            </p>

            <div className="input">
                <input
                    ref={inputRef}
                    readOnly
                    aria-label="Session link"
                    value={url}
                    onFocus={(e) => e.target.select()}
                />
                <button type="button" className="copy-btn" onClick={copy}>
                    <span className="material-icons" aria-hidden="true">
                        {copied ? 'check' : 'content_copy'}
                    </span>
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
            </div>

            <p className="share-warning">
                There is no sign-in — the link is the only key, and it cannot be
                revoked once shared. Runs started in this session use your Judge0 quota.
            </p>
        </ModelShell>
    );
};
