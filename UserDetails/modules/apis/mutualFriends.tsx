/// <reference path="../../../types/main.d.ts" />
import {useStateFromStores} from "@discord/flux";
import {Messages} from "@discord/i18n";
import {SelectedGuilds, Status, UserProfile, Users} from "@discord/stores";
import {Logger, WebpackModules} from "@zlibrary";
import React, {useEffect, useState} from "react";
import Settings from "../Settings";
import Strings from "../strings";
import styles from "./mutualFriends.scss";
import {Tooltip} from "@discord/components";
import {joinClassNames} from "@discord/utils";
import {ProfileActions} from "@discord/actions";
import {Dispatcher} from "@discord/modules";
import {useSettings} from "./util";

const Header = WebpackModules.getModule(m => m.displayName === "Header" && m.Sizes);
const WindowStore = WebpackModules.getByProps("isFocused");
const {AnimatedAvatar, Sizes} = WebpackModules.getByProps("AnimatedAvatar");
const UserProfileModal = WebpackModules.getByProps("openUserProfileModal");
const {ComponentDispatch} = WebpackModules.getByProps("ComponentDispatch") ?? {};

export function MutualFriend({user}) {
    const [isMouseOver, setMouseOver] = useState(false);
    const isWindowFocused = useStateFromStores([WindowStore], () => WindowStore.isFocused());

    return (
        <Tooltip text={user.tag} position="top">
            {props => (
                <div
                    className={styles.mutualFriend}
                    onMouseOver={() => (setMouseOver(true), props.onMouseEnter())}
                    onMouseLeave={() => (setMouseOver(false), props.onMouseLeave())}
                    onClick={() => {
                        UserProfileModal.openUserProfileModal({userId: user.id, guildId: SelectedGuilds.getGuildId()});
                        ComponentDispatch.dispatchToLastSubscribed("POPOUT_CLOSE");
                    }}
                >
                    <AnimatedAvatar
                        status={Status.getStatus(user.id)}
                        size={Sizes.SIZE_32}
                        src={user.getAvatarURL(SelectedGuilds.getGuildId(), 32, isMouseOver && isWindowFocused)} 
                    />
                </div>
            )}    
        </Tooltip>
    );
};

export default function MutualFriends({user}) {
    const settings = useSettings({
        showMutualFriends: true,
        hideMutualFriendsCurrentUser: true,
        showEmptyMutualFriends: true,
        stackMutualFriends: false
    });

    if (!settings.showMutualFriends || (settings.hideMutualFriendsCurrentUser && user.id === Users.getCurrentUser().id)) return null;
    
    const mutualFriends = useStateFromStores([UserProfile], () => (UserProfile as any).getMutualFriends(user.id));

    useEffect(() => {
        if (Array.isArray(mutualFriends)) return;
        
        (Dispatcher as any).wait(() => (ProfileActions as any).fetchMutualFriends(user.id));
    }, []);
    
    return Array.isArray(mutualFriends)
        ? mutualFriends.length
            ? (
                <div className={styles.body}>
                    <Header size={Header.Sizes.SIZE_12} className={styles.header} uppercase muted>{Messages.MUTUAL_FRIENDS}</Header>
                    <div className={joinClassNames(styles.friends, settings.stackMutualFriends && styles.stack)}>
                        {mutualFriends.map(props => <MutualFriend {...props} />)}
                    </div>
                </div>
            )
            : settings.showEmptyMutualFriends && (
                <Header size={Header.Sizes.SIZE_12} className={styles.header} uppercase muted>
                    {Strings.get("NO_MUTUAL_FRIENDS")}
                </Header>
            )
        : (
            <Header size={Header.Sizes.SIZE_12} className={styles.header} uppercase muted>
                {Strings.get("LOADING_MUTUAL_FRIENDS")}
            </Header>
        );
};