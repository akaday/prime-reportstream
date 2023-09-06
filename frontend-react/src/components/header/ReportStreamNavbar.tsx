import {
    Button,
    GovBanner,
    Header,
    Menu,
    NavDropDownButton,
    NavMenuButton,
    PrimaryNav,
    Title,
} from "@trussworks/react-uswds";
import classnames from "classnames";
import { useState } from "react";

import { USLinkButton } from "../USLink";
import config from "../../config";
import { DAPHeader } from "../header/DAPHeader";
import SenderModeBanner from "../SenderModeBanner";
import { useSessionContext } from "../../contexts/SessionContext";
import { logout } from "../../utils/UserUtils";
import { Icon } from "../../shared";
import site from "../../content/site.json";

import styles from "./ReportStreamNavbar.module.scss";

const { IS_PREVIEW, CLIENT_ENV, APP_ENV } = config;

export const ReportStreamNavbar = ({
    blueVariant,
}: {
    blueVariant?: boolean;
}) => {
    const {
        activeMembership,
        isAdminStrictCheck,
        isUserAdmin,
        isUserReceiver,
        isUserSender,
        user,
    } = useSessionContext();
    const [openMenuItem, setOpenMenuItem] = useState<null | string>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const toggleMobileMenu = () => {
        if (mobileMenuOpen) {
            setMobileMenuOpen(false);
        } else {
            setMobileMenuOpen(true);
        }
    };
    const setMenu = (menuName: string) => {
        if (openMenuItem === menuName) {
            setOpenMenuItem(null);
        } else {
            setOpenMenuItem(menuName);
        }
    };

    const Dropdown = ({
        menuName,
        dropdownList,
    }: {
        menuName: string;
        dropdownList: React.ReactElement[];
    }) => {
        return (
            <>
                <NavDropDownButton
                    menuId={menuName.toLowerCase()}
                    isOpen={openMenuItem === menuName}
                    isCurrent={openMenuItem === menuName}
                    label={menuName}
                    onToggle={() => {
                        setMenu(menuName);
                    }}
                />
                <Menu
                    items={dropdownList}
                    isOpen={openMenuItem === menuName}
                    id={`${menuName}Dropdown`}
                />
            </>
        );
    };
    const defaultMenuItems = [
        <div className="primary-nav-link-container">
            <a className="primary-nav-link" href="/product" key="product">
                Product
            </a>
        </div>,
        <div className="primary-nav-link-container">
            <a className="primary-nav-link" href="/resources" key="resources">
                Resources
            </a>
        </div>,
        <div className="primary-nav-link-container">
            <a className="primary-nav-link" href="/support" key="support">
                Support
            </a>
        </div>,
    ];

    const menuItemsReceiver = [
        <div className="primary-nav-link-container">
            <a className="primary-nav-link" href="/daily-data" key="daily">
                Daily Data
            </a>
        </div>,
    ];

    const menuItemsSender = [
        <div className="primary-nav-link-container">
            <a
                className="primary-nav-link"
                href="/submissions"
                key="submissions"
            >
                Submissions
            </a>
        </div>,
    ];

    const menuItemsAdmin = [
        <Dropdown
            menuName="Admin"
            dropdownList={[
                <a href="/admin/settings" key="settings">
                    Organization Settings
                </a>,
                <a href="/admin/lastmile" key="lastmile">
                    Feature Flags
                </a>,
                <a href="/admin/features" key="features">
                    Last Mile Failures
                </a>,
                <a href="/admin/message-tracker" key="message-tracker">
                    Message Id Search
                </a>,
                <a href="/admin/send-dash" key="send-dash">
                    Receiver Status Dashboard
                </a>,
                <a href="/admin/value-sets" key="value-sets">
                    Value Sets
                </a>,
                <a href="/admin/validate" key="validate">
                    Validate
                </a>,
            ]}
        />,
    ];
    const navbarItemBuilder = () => {
        let menuItems = defaultMenuItems;

        if (isUserReceiver || isUserAdmin) {
            menuItems = [...menuItems, ...menuItemsReceiver];
        }

        if (isUserSender || isUserAdmin) {
            menuItems = [...menuItems, ...menuItemsSender];
        }

        if (isAdminStrictCheck) {
            menuItems = [...menuItems, ...menuItemsAdmin];
        }

        return menuItems;
    };
    return (
        <>
            <DAPHeader env={APP_ENV ? APP_ENV : "production"} />
            <GovBanner aria-label="Official government website" />
            <SenderModeBanner />
            <div
                className={`usa-overlay ${mobileMenuOpen ? "is-visible" : ""}`}
            ></div>
            <Header
                basic={true}
                className={classnames(styles.Navbar, {
                    [styles.NavbarBlueVariant]: blueVariant,
                    [styles.NavbarDefault]: !blueVariant,
                })}
            >
                <div className="usa-nav-container">
                    <div className="usa-navbar">
                        <Title>
                            ReportStream
                            {IS_PREVIEW && (
                                <span className={styles.ClientEnv}>
                                    {CLIENT_ENV}
                                </span>
                            )}
                        </Title>
                        <NavMenuButton
                            onClick={toggleMobileMenu}
                            label="Menu"
                        />
                    </div>
                    <PrimaryNav
                        items={navbarItemBuilder()}
                        mobileExpanded={mobileMenuOpen}
                        onToggleMobileNav={toggleMobileMenu}
                    >
                        <div className="nav-cta-container">
                            {user ? (
                                <>
                                    <span className={styles.UserEmail}>
                                        {user?.email ?? "Unknown"}
                                    </span>
                                    {isUserAdmin && (
                                        <USLinkButton
                                            outline
                                            href="/admin/settings"
                                        >
                                            {activeMembership?.parsedName || ""}{" "}
                                            <Icon
                                                name="Loop"
                                                className="text-tbottom"
                                            />
                                        </USLinkButton>
                                    )}

                                    <Button
                                        id="logout"
                                        type="button"
                                        onClick={logout}
                                    >
                                        Logout
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <USLinkButton href="/login">
                                        Login
                                    </USLinkButton>
                                    <USLinkButton
                                        href={site.forms.connectWithRS.url}
                                        outline
                                        extLinkIcon
                                    >
                                        Connect now
                                    </USLinkButton>
                                </>
                            )}
                        </div>
                    </PrimaryNav>
                </div>
            </Header>
        </>
    );
};