import { Box, NavBar as NavBarComponent, NavBarSection } from '@rocket.chat/fuselage';
import { useSetting, useUser } from '@rocket.chat/ui-contexts';
import { useVideoConfWindowEnabled } from '@rocket.chat/ui-video-conf';
import { useTranslation } from 'react-i18next';

import NavBarItemOngoingCalls from '../../navbar/NavBarItemOngoingCalls';
import NavBarNavigation from '../../navbar/NavBarNavigation';

const SidebarRailHeader = () => {
	const { t } = useTranslation();
	const user = useUser();
	const siteName = useSetting('Site_Name', '');
	const showOngoingCalls = useVideoConfWindowEnabled();

	return (
		<NavBarComponent aria-label={t('Sidebar_rail_header')} style={{ paddingInline: '0.5rem' }}>
			<NavBarSection>
				<Box is='img' src='/images/logo/icon.svg' alt={siteName} size='x28' />
			</NavBarSection>
			<NavBarNavigation />
			<NavBarSection>{user && showOngoingCalls && <NavBarItemOngoingCalls />}</NavBarSection>
		</NavBarComponent>
	);
};

export default SidebarRailHeader;
