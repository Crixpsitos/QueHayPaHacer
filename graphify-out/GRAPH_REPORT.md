# Graph Report - QueHayPaHacer-copilot  (2026-11-05)

## Corpus Check
- Large corpus: 1047 files · ~346,991 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 4851 nodes · 15534 edges · 214 communities (164 shown, 50 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 379 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 34
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 54
- Community 55
- Community 56
- Community 57
- Community 58
- Community 59
- Community 60
- Community 61
- Community 62
- Community 63
- Community 64
- Community 65
- Community 66
- Community 67
- Community 68
- Community 69
- Community 70
- Community 71
- Community 72
- Community 73
- Community 74
- Community 75
- Community 76
- Community 77
- Community 78
- Community 79
- Community 80
- Community 81
- Community 82
- Community 83
- Community 84
- Community 85
- Community 86
- Community 87
- Community 88
- Community 89
- Community 90
- Community 91
- Community 92
- Community 93
- Community 94
- Community 95
- Community 96
- Community 97
- Community 98
- Community 99
- Community 100
- Community 101
- Community 102
- Community 103
- Community 104
- Community 105
- Community 106
- Community 107
- Community 108
- Community 109
- Community 110
- Community 111
- Community 112
- Community 113
- Community 114
- Community 115
- Community 116
- Community 117
- Community 118
- Community 119
- Community 120
- Community 121
- Community 122
- Community 123
- Community 124
- Community 125
- Community 126
- Community 127
- Community 128
- Community 129
- Community 130
- Community 131
- Community 132
- Community 133
- Community 134
- Community 135
- Community 136
- Community 137
- Community 138
- Community 139
- Community 140
- Community 141
- Community 142
- Community 143
- Community 144
- Community 145
- Community 146
- Community 147
- Community 148
- Community 149
- Community 150
- Community 151
- Community 152
- Community 153
- Community 154
- Community 155
- Community 156
- Community 157
- Community 158
- Community 159
- Community 160
- Community 161
- Community 162
- Community 163
- Community 164
- Community 165
- Community 166
- Community 167
- Community 169
- Community 170
- Community 171
- Community 172
- Community 173
- Community 174
- Community 175
- Community 176
- Community 186
- Community 188
- Community 189
- Community 190
- Community 191
- Community 192
- Community 193
- Community 194
- Community 195
- Community 196
- Community 197
- Community 198
- Community 199
- Community 200
- Community 201
- Community 202
- Community 203
- Community 204
- Community 205
- Community 206
- Community 207
- Community 208
- Community 209

## God Nodes (most connected - your core abstractions)
1. `cn()` - 365 edges
2. `createServerContainer()` - 361 edges
3. `next` - 252 edges
4. `react` - 184 edges
5. `lucide-react` - 173 edges
6. `Button()` - 93 edges
7. `Events` - 84 edges
8. `firebase-admin` - 84 edges
9. `EventViewModel` - 69 edges
10. `getFirebaseFirestore()` - 60 edges

## Surprising Connections (you probably didn't know these)
- `CreateDraftEventActionResult` --references--> `EventViewModel`  [EXTRACTED]
  app/actions/events/create-draft-event.action.ts → presentation/events/view-models/EventViewModel.ts
- `LoadMoreSearchResult` --references--> `EventViewModel`  [EXTRACTED]
  app/actions/explore/load-more-explore-search.action.ts → presentation/events/view-models/EventViewModel.ts
- `UpdateProfileInput` --references--> `SocialLinkEntry`  [EXTRACTED]
  app/actions/profile/update-profile.action.ts → domain/entities/user/User.ts
- `resolve()` --calls--> `resolveSiteSuggestionAction()`  [EXTRACTED]
  presentation/sites/components/suggest/MySuggestionsPanel.tsx → app/actions/site-suggestions/resolve-site-suggestion.action.ts
- `submit()` --calls--> `suggestSiteChangeAction()`  [EXTRACTED]
  presentation/sites/components/suggest/SiteSuggestCta.tsx → app/actions/site-suggestions/suggest-site-change.action.ts

## Import Cycles
- 3-file cycle: `presentation/events/components/form/RegistrationFormBuilder.tsx -> presentation/events/components/ui/FieldCard.tsx -> presentation/events/components/ui/FieldPreview.tsx -> presentation/events/components/form/RegistrationFormBuilder.tsx`

## Communities (214 total, 50 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.04
Nodes (70): getUserSitesForPickerAction(), AuthorDeclaration(), SITE_TEXT, Variant, ExploreSearchBar(), ExploreSearchBarProps, SPRING_SNAPPY, AvatarGroup() (+62 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (31): allowed, Body, globalAllowed, Id, POST(), createGlobalLimiter(), isSameOriginBeacon(), readBoundedJson() (+23 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (47): DeleteAccountPayload, DeleteAccountResult, googleAuthAction(), GoogleAuthActionResult, GoogleUserData, AUTH_ERROR_MESSAGES, LoginActionResult, ContactActionInput (+39 more)

### Community 3 - "Community 3"
Cohesion: 0.05
Nodes (45): RecountDeps, recountSites(), NotificationService, claimResolvedNotification(), suggestionResolvedNotification(), clip(), NewNotification, NOTIFICATION_BODY_MAX (+37 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (55): EMPTY_OVERVIEW, getCachedOrganizerOverview(), metadata, StudioOverviewPage(), RampUnit, RegistrationRampPoint, ChartEmpty(), AXIS_TICK (+47 more)

### Community 5 - "Community 5"
Cohesion: 0.10
Nodes (52): reportContentAction(), GoogleAuthButton(), GoogleAuthButtonProps, GoogleIcon(), CountUp(), EASE_OUT, SPRING_SOFT, CommandDialog() (+44 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (54): AnimatedGradientText(), AnimatedGradientTextProps, AvatarBadge(), Badge(), badgeVariants, Card(), CardAction(), CardContent() (+46 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (49): Checkbox(), Field(), FieldError(), FieldGroup(), FieldLabel(), fieldVariants, Input(), Label() (+41 more)

### Community 8 - "Community 8"
Cohesion: 0.06
Nodes (54): instant, SitesLayout(), SitesModuleWithRole(), SiteKind, SitePublishedAsForm, MediaSlide, SiteGalleryTrigger(), SiteGalleryTriggerProps (+46 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (31): Result, LoadMoreResult, LoadMoreResult, EventModerationMode, EventModerationStatus, EventStatus, CategoryInfo, Dates (+23 more)

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (49): getEventsBySiteAction(), getSiteTransitViewAction(), reportTransitOutdatedAction(), hasRecommendations(), normalizeRecommendations(), SITE_TIP_IDS, SITE_TIP_LABELS, SITE_TIP_OPTIONS (+41 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (30): base, site, LEGAL_VERSION, parseSiteSuggestionInput(), SiteSuggestionInput, SiteSuggestionInputSchema, ResolveSuggestionResult, SiteSuggestionResult (+22 more)

### Community 12 - "Community 12"
Cohesion: 0.08
Nodes (49): bubbleStyle(), ComparisonTable(), CopCountUp(), Cta(), EASE, FaqList(), FeatureItem(), MotionLink (+41 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (45): generateMetadata(), PublicProfilePage(), PublicProfilePageProps, PublicProfileSkeleton(), getInitials(), ProfileConfig, selectedSectionSetting, useProfileConfigStore (+37 more)

### Community 14 - "Community 14"
Cohesion: 0.06
Nodes (23): apply, eventAction, sessionAction, DIRECT, VIA_SESSION_HOOK, GUARDED, PUBLIC_UID_OK, context (+15 more)

### Community 15 - "Community 15"
Cohesion: 0.06
Nodes (14): AuthService, IAuthRepository, ClientContainer, firebaseConfig, getFirebaseApp(), getFirebaseAuth(), subscribeWhenAuthed(), getFirebaseFirestore() (+6 more)

### Community 16 - "Community 16"
Cohesion: 0.06
Nodes (5): PaginatedEventIds, EventsAdapter, IEventsMapper, removeUndefinedProperties(), IEventsFirebaseRepository

### Community 17 - "Community 17"
Cohesion: 0.07
Nodes (49): declarationVariant, HOLIDAY_POLICIES, HOLIDAY_POLICY_LABELS, HolidayPolicy, normalizeOpeningPolicy(), RAIN_NOTE_MAX, RAIN_POLICIES, RAIN_POLICY_LABELS (+41 more)

### Community 18 - "Community 18"
Cohesion: 0.10
Nodes (35): recordEventViewAction(), recordEventView(), GET(), GET(), NO_STORE, ViewItem(), EventDetailPageProps, generateMetadata() (+27 more)

### Community 19 - "Community 19"
Cohesion: 0.10
Nodes (18): GET(), UserPreferencesService, CategoryScore, UserPreferences, IUserPreferencesRepository, UserPreferencesAdapter, FirebaseCategoryScore, FirebaseUserPreferencesDto (+10 more)

### Community 20 - "Community 20"
Cohesion: 0.05
Nodes (43): DEFAULT_EXTERNAL_BUTTON_LABEL, DEFAULT_EXTERNAL_NOTICE, EXTERNAL_BUTTON_LABEL_MAX, EXTERNAL_NOTICE_MAX, AuthorDraftSchema, AuthorSchema, CategoryInfoSchema, collaboratorEntries (+35 more)

### Community 21 - "Community 21"
Cohesion: 0.12
Nodes (36): EventAttendeeVM, getEventAttendeesAction(), getExternalProfileAction(), respondCollaboratorInvitationAction(), getVerifiedCreators(), initials(), VerifiedCreatorsSection(), Avatar() (+28 more)

### Community 22 - "Community 22"
Cohesion: 0.10
Nodes (36): loadMoreExploreSitesAction(), LoadMoreSitesResult, loadMoreSitesAction(), InfiniteSiteCategoryListProps, DondeIrIndexPage(), metadata, ExploreBrowseSiteSection, InfiniteSiteList() (+28 more)

### Community 23 - "Community 23"
Cohesion: 0.14
Nodes (32): ContentSection(), ContentSectionProps, Separator(), EventosIndexPage(), metadata, EventCardInteractive(), EventCardInteractiveProps, PendingLikeState (+24 more)

### Community 24 - "Community 24"
Cohesion: 0.09
Nodes (13): CategoriesService, Categories, Navigation, NavigationSort, ICategoriesRepository, IBaseRepository, CategoriesAdapter, FirebaseCategoriesDto (+5 more)

### Community 25 - "Community 25"
Cohesion: 0.08
Nodes (31): CLIENT_REFRESHABLE_TAGS, UpdateTagActionResult, UpdateBannerInput, UpdateBannerResult, getPremiumSessionUid(), redirectLimitedToEvents(), ActionResult, closeSupportTicketAction() (+23 more)

### Community 26 - "Community 26"
Cohesion: 0.07
Nodes (4): SiteTrackType, SitesAdapter, SiteFirebaseMapper, ISitesFirebaseRepository

### Community 27 - "Community 27"
Cohesion: 0.09
Nodes (39): sendContactAction(), CONTACT_REASON_VALUES, CONTACT_REASONS, ContactForm(), ContactFormValues, ContactReason, contactSchema, FieldWrapper() (+31 more)

### Community 28 - "Community 28"
Cohesion: 0.13
Nodes (34): getUnreadNotificationsCountAction(), listNotificationsAction(), markNotificationsReadAction(), hasPendingSiteClaimAction(), requestSiteClaimAction(), listMySiteSuggestionsAction(), hasPendingSiteSuggestionAction(), ICONS (+26 more)

### Community 29 - "Community 29"
Cohesion: 0.07
Nodes (5): EventFeed, EventsService, NOW, service(), IEventsRepository

### Community 30 - "Community 30"
Cohesion: 0.13
Nodes (28): createDraftEventAction(), CreateDraftEventActionResult, enforcePlanFeatures(), EventModerationFields, moderationFieldsForSubmission(), optimizedPathFor(), PlanGatedFields, reconcileMainImage() (+20 more)

### Community 31 - "Community 31"
Cohesion: 0.10
Nodes (30): likeEventAction(), shareEventAction(), recordSiteInteractionAction(), analytics, applyFreshLikes(), key(), LikedMap, LikeKind (+22 more)

### Community 32 - "Community 32"
Cohesion: 0.07
Nodes (14): decodeScoreCursor(), encodeScoreCursor(), FEATURED_MAX, isPromotionActive(), mergeFeaturedIds(), FirebaseEventsDto, EventsFirebaseRepository, done() (+6 more)

### Community 33 - "Community 33"
Cohesion: 0.08
Nodes (6): EventComparisonPoint, InteractivityPoint, RegistrationTimelinePoint, TopEvent, CheckInByCodeResult, StudioFirebaseRepository

### Community 34 - "Community 34"
Cohesion: 0.09
Nodes (33): loadMoreExploreSearchAction(), LoadMoreSearchResult, InfiniteExploreSearch(), InfiniteExploreSearchProps, INFO, InfiniteSiteCategoryList(), EventCategorySection(), ExplorarContent() (+25 more)

### Community 35 - "Community 35"
Cohesion: 0.11
Nodes (28): MediaItem, ImageDropzoneProps, ImageMainDropzone(), MainImageValue, MediaDropzone(), MediaDropzoneProps, TileActions(), RichTextEditorSkeleton() (+20 more)

### Community 36 - "Community 36"
Cohesion: 0.13
Nodes (30): logoutAction(), getPendingSiteSuggestionsCountAction(), Navbar(), ToastState, AccountTriggerSkeleton(), InviteDot(), NavbarAccountMenu(), DropdownMenu() (+22 more)

### Community 37 - "Community 37"
Cohesion: 0.12
Nodes (10): EventFeedItem, EventInteractions, EventInteractionsAdapter, DenormalizedEventFirebaseData, FirebaseEventInteractionDto, EventInteractionsFirebaseMapper, IEventInteractionsMapper, cleanUndefined() (+2 more)

### Community 38 - "Community 38"
Cohesion: 0.10
Nodes (25): bogotaYear(), getHolidaysAction(), load(), HolidayService, key(), addDays(), computeColombiaHolidays(), easterSunday() (+17 more)

### Community 39 - "Community 39"
Cohesion: 0.11
Nodes (31): deleteEventAction(), getEventSessionsAction(), teamAccessTag(), changeCollaboratorRoleAction(), ALL, ASSIGNABLE_USER_ROLES, can(), hasStudioAccess() (+23 more)

### Community 40 - "Community 40"
Cohesion: 0.13
Nodes (31): registerEventAction(), recordExternalRegistrationClickAction(), Reveal(), readableTextColor(), safeHexColor(), EventChips(), EventHero(), buildSlides() (+23 more)

### Community 41 - "Community 41"
Cohesion: 0.11
Nodes (26): Login(), metadata, metadata, RegisterPage(), LoginActionResult, LoginForm(), LoginFormProps, LoginFormValues (+18 more)

### Community 42 - "Community 42"
Cohesion: 0.11
Nodes (5): UserService, User, IUserRepository, UserAdapter, IUserFirebaseRepository

### Community 43 - "Community 43"
Cohesion: 0.11
Nodes (27): CampaignCarouselComponent(), CampaignCarouselProps, CampaignDots(), useCampaignCarousel(), SuccessCheck(), Button(), buttonVariants, Carousel() (+19 more)

### Community 44 - "Community 44"
Cohesion: 0.08
Nodes (29): fields, OpeningPolicy, OptionalHttpUrl, Sections, base, check(), SITE_CATEGORIES, SiteDraftSchema (+21 more)

### Community 45 - "Community 45"
Cohesion: 0.13
Nodes (11): EventRegistrationService, EventRegistration, IEventRegistrationRepository, RegisterEventInput, FirebaseEventRegistration, EventRegistrationFirebaseMapper, IEventRegistrationMapper, isPlainObject() (+3 more)

### Community 46 - "Community 46"
Cohesion: 0.12
Nodes (10): BadgeService, Badge, BadgeCategory, BadgeCriteria, IBadgeRepository, BadgeAdapter, FirebaseBadgeDto, BadgeFirebaseMapper (+2 more)

### Community 47 - "Community 47"
Cohesion: 0.11
Nodes (29): changePasswordAction(), ChangePasswordPayload, ChangePasswordResult, deleteAccountAction(), loginAction(), checkUsernameAvailabilityAction(), resolveAvatarErrorMessage(), updateAvatarAction() (+21 more)

### Community 48 - "Community 48"
Cohesion: 0.12
Nodes (15): ExternalProfilePublic, EventRegistration, ExternalProfileType, ExternalSocialLinks, SupportTicket, SupportTicketDetail, FirebaseExternalProfileDto, FirebaseReceivedInviteDto (+7 more)

### Community 49 - "Community 49"
Cohesion: 0.14
Nodes (14): AudienceSummary, CollaboratorInvitation, EventRegistrationsResult, ExternalProfile, ExternalProfileInput, GetEventRegistrationsParams, GetOrganizerEventsParams, GetStudioListParams (+6 more)

### Community 50 - "Community 50"
Cohesion: 0.13
Nodes (14): Coordinates, ImageMedia, DaySchedule, Schedule, SiteAnalytics, SiteAuthor, SiteLocation, SiteMedia (+6 more)

### Community 51 - "Community 51"
Cohesion: 0.11
Nodes (18): base, site, parseSiteClaimInput(), SiteClaimInput, SiteClaimInputSchema, SiteClaimResult, SiteClaimService, CLAIM_EVIDENCE_MAX (+10 more)

### Community 52 - "Community 52"
Cohesion: 0.13
Nodes (21): Container(), ContainerProps, Skeleton(), ProfileNotFound(), EventCardSkeleton(), EventSectionSkeleton(), Loading(), metadata (+13 more)

### Community 53 - "Community 53"
Cohesion: 0.12
Nodes (5): EventSessionAdapter, FirebaseEventSessionDto, EventSessionFirebaseMapper, EventSessionFirebaseRepository, IEventSessionFirebaseRepository

### Community 54 - "Community 54"
Cohesion: 0.13
Nodes (28): dateLine(), EventPlace(), LinkedSiteCard(), d(), DateInput, dateParts(), dayFmt, dayMonthFmt (+20 more)

### Community 55 - "Community 55"
Cohesion: 0.11
Nodes (26): CreatedExternal, createExternalProfileAction(), getMyCollaboratorsAction(), cancelInvitationAction(), inviteCollaboratorsAction(), removeCollaboratorAction(), searchCollaboratorsAction(), initials() (+18 more)

### Community 56 - "Community 56"
Cohesion: 0.17
Nodes (21): buildSiteInput(), deleteSiteAction(), Result, getMySitesAction(), publishSiteAction(), Result, revalidateSite(), Result (+13 more)

### Community 57 - "Community 57"
Cohesion: 0.13
Nodes (7): EventInteractionsService, extractEventData(), DenormalizedEventData, IEventInteractionsRepository, IUserEventInteractionsProjectionRepository, cleanUndefined(), UserEventInteractionsProjectionFirebaseRepository

### Community 58 - "Community 58"
Cohesion: 0.13
Nodes (7): UserRegistrationItem, CancelRegistrationResult, CheckInCodeResult, EventRegistrationAdapter, FirebaseEventRegistrationEntry, EventRegistrationFirebaseRepository, IEventRegistrationFirebaseRepository

### Community 59 - "Community 59"
Cohesion: 0.09
Nodes (4): StudioService, EventStats, MultiDateEventStats, IStudioRepository

### Community 60 - "Community 60"
Cohesion: 0.14
Nodes (23): createEventSessionAction(), CreateSessionResult, deleteEventSessionAction(), DeleteSessionResult, afterSessionChange(), sessionOwnerError(), sessionSiteLinkError(), saveDraftSessionAction() (+15 more)

### Community 61 - "Community 61"
Cohesion: 0.14
Nodes (21): DeleteEventResult, load(), GET(), getCategories(), ModerationDecisionSchema, POST(), Body, Id (+13 more)

### Community 62 - "Community 62"
Cohesion: 0.12
Nodes (17): ReportContentInput, DocId, parseReportInput(), ReportInput, ReportInputSchema, base, ReportResult, ReportService (+9 more)

### Community 63 - "Community 63"
Cohesion: 0.13
Nodes (26): fetchMyProfileData(), useCachedFetch(), EventStatusBadge(), EventStatusBadgeProps, STATUS_MAP, ACTIVITY_META, formatActivityDate(), ProfileTimeline() (+18 more)

### Community 64 - "Community 64"
Cohesion: 0.15
Nodes (7): authorIdOf(), contentFields(), fake(), SiteInput, SitesService, ClaimSiteSnapshot, pickDiscoverIds()

### Community 65 - "Community 65"
Cohesion: 0.11
Nodes (23): canLinkEventToSite(), isLinkableSite(), SITE_LINK_ERROR, SiteLinkSnapshot, siteLinkViolation(), own, initialVerification(), SITE_KINDS (+15 more)

### Community 66 - "Community 66"
Cohesion: 0.14
Nodes (20): buildSiteMedia(), Completeness, COMPLETENESS_RULES, CompletenessInput, CompletenessRule, DESCRIPTION_MIN, getSiteCompleteness(), empty (+12 more)

### Community 67 - "Community 67"
Cohesion: 0.11
Nodes (21): Entry, idbBackend, MY_DATA_KEYS, openDb(), readCache, removeCache, store(), updateCache (+13 more)

### Community 68 - "Community 68"
Cohesion: 0.12
Nodes (24): EMPTY_PAGE, getCachedOrganizerEvents(), LIMIT_OPTIONS, metadata, StudioEventsPage(), StudioEventsPageProps, toViewModel(), cursorHref() (+16 more)

### Community 69 - "Community 69"
Cohesion: 0.13
Nodes (11): HolidaySource, parseTransitRoutes(), TransitRouteService, Snap, ConfigDoc, IConfigRepository, ConfigFirebaseRepository, revalidateConfig() (+3 more)

### Community 70 - "Community 70"
Cohesion: 0.11
Nodes (19): getFirebaseFirestore(), APPLY, main(), APPLY, main(), APPLY, main(), APPLY (+11 more)

### Community 71 - "Community 71"
Cohesion: 0.15
Nodes (19): getTransitRoutesAction(), load(), byLabel(), TransitReportResult, buildTransitView(), normalizeTransit(), sameTransit(), SiteTransit (+11 more)

### Community 72 - "Community 72"
Cohesion: 0.12
Nodes (20): DondeIrDetail(), DondeIrDetailPage(), generateMetadata(), PageProps, SiteDetailSkeleton(), CollectionLanding(), CollectionLandingPage(), CollectionSkeleton() (+12 more)

### Community 73 - "Community 73"
Cohesion: 0.24
Nodes (15): HomeLayout(), HomeLayoutProps, PageContent(), TooltipProvider(), DondeIrLayout(), EventosIndexLayout(), EventDetailLayout(), ExplorarLayout() (+7 more)

### Community 74 - "Community 74"
Cohesion: 0.15
Nodes (17): CreateEventPage(), CreateEventPageProps, EditEventPage(), EditEventPageProps, ConvertToMultiDateDialog(), ConvertToMultiDateDialogProps, ConvertToStandardDialog(), EventClientWrapper() (+9 more)

### Community 75 - "Community 75"
Cohesion: 0.10
Nodes (4): FirebaseSiteDto, day, PaginatedSiteIds, SitesFirebaseRepository

### Community 76 - "Community 76"
Cohesion: 0.15
Nodes (6): ProfileStats, ProfileAdapter, FirestoreDoc, ProfileInteractionsRaw, IProfileFirebaseRepository, ProfileFirebaseRepository

### Community 77 - "Community 77"
Cohesion: 0.14
Nodes (22): dateFormat, EventPosterCard(), EventPosterCardProps, metric(), numberFormat, OTHER_LABELS, STATUS, conversion() (+14 more)

### Community 78 - "Community 78"
Cohesion: 0.15
Nodes (13): applyRetry(), RetryEventMediaResult, canRetryNow(), decideRetry(), Item, RETRY_COOLDOWN_MS, RetryDecision, RetryScope (+5 more)

### Community 79 - "Community 79"
Cohesion: 0.13
Nodes (23): deleteBannerAction(), updateBannerAction(), ACCEPTED_TYPES, ProfileBannerProps, AbstractVariant(), BANNER_ASPECT_RATIO, BANNER_OUTPUT_HEIGHT, BANNER_OUTPUT_WIDTH (+15 more)

### Community 80 - "Community 80"
Cohesion: 0.18
Nodes (9): ContactService, CreateContactInput, Contact, IContactRepository, ContactAdapter, FirebaseContactDto, ContactFirebaseMapper, ContactFirebaseRepository (+1 more)

### Community 81 - "Community 81"
Cohesion: 0.08
Nodes (26): dependencies, class-variance-authority@^0.7.1, date-fns@^4.3.0, @dnd-kit/sortable@^10.0.0, firebase@^12.11.0, firebase-admin@^14.0.0, @hookform/resolvers@^5.2.2, lucide-react@^1.14.0 (+18 more)

### Community 82 - "Community 82"
Cohesion: 0.16
Nodes (19): EventAccess, EventAccessRole, TeamAction, RegistrationType, EventDetailHeader(), EventDetailHeaderProps, formatDate(), MultiDateStatsPanelProps (+11 more)

### Community 83 - "Community 83"
Cohesion: 0.19
Nodes (19): requireEventPermission(), LIMIT_OPTIONS, SessionRegistrations(), SlotProps, StudioSessionDetailPage(), EventDetailPage(), EventDetailPageProps, EventRegistrationsSlot() (+11 more)

### Community 84 - "Community 84"
Cohesion: 0.19
Nodes (16): CampaignCarouselSkeleton(), ContributionBanner(), CreatorVerificationBanner(), HomeSearchBar(), PremiumBanner(), Section(), SectionProps, spacingClasses (+8 more)

### Community 85 - "Community 85"
Cohesion: 0.15
Nodes (22): adviseTravel(), BUS_MIN_KM, busRoutesToOffer(), DirectionsAdvice, FAR_KM, googleMapsDirectionsUrl(), haversineKm(), isUsableCoordinates() (+14 more)

### Community 86 - "Community 86"
Cohesion: 0.21
Nodes (15): setSessionStatusAction(), invalidateMyData, EventSession, resolveCoverUrl(), SessionCard(), SessionCardProps, SessionFormProps, detectOverlaps() (+7 more)

### Community 87 - "Community 87"
Cohesion: 0.22
Nodes (14): canViewProfile(), GET(), GET(), GET(), GET(), PublicProfileTabs, PublicProfileTabsData(), cachedPublicUser() (+6 more)

### Community 88 - "Community 88"
Cohesion: 0.09
Nodes (22): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+14 more)

### Community 89 - "Community 89"
Cohesion: 0.09
Nodes (22): eslintConfig, devDependencies, eslint@^9, eslint-config-next@16.2.2, shadcn@4.21.0, tailwindcss@^4, @tailwindcss/postcss@^4, tsx@^4.23.15 (+14 more)

### Community 90 - "Community 90"
Cohesion: 0.13
Nodes (17): main(), readArguments(), avatar(), clean(), main(), rnd(), slugify(), avatar() (+9 more)

### Community 91 - "Community 91"
Cohesion: 0.19
Nodes (16): loadMoreAllEventsAction(), loadMoreCategoryEventsAction(), AllEventsContainer(), CollectionEventsSection(), EMPTY_INFO, ItemListJsonLd(), InfiniteEventList(), InfiniteEventListProps (+8 more)

### Community 92 - "Community 92"
Cohesion: 0.20
Nodes (6): CTA, CampaignService, Campaign, ICampaignRepository, CampaignFirebaseMapper, ICampaignMapper

### Community 93 - "Community 93"
Cohesion: 0.19
Nodes (7): Events, cityDetail(), detailWithSlug(), EventsFirebaseMapper, toDomainLocation(), toLatLng(), toStoredLocation()

### Community 94 - "Community 94"
Cohesion: 0.09
Nodes (21): runs-on, steps, concurrency, cancel-in-progress, group, jobs, checks, name (+13 more)

### Community 95 - "Community 95"
Cohesion: 0.12
Nodes (10): firebase-admin, db, db, KEEP, APPLY, db, SLUG_MAP, APPLY (+2 more)

### Community 96 - "Community 96"
Cohesion: 0.18
Nodes (17): getAdminUid(), getHolidaysAdminAction(), NOT_ALLOWED, refreshConfigCacheAction(), resetHolidaysAction(), Result, saveHolidaysAction(), validYear() (+9 more)

### Community 97 - "Community 97"
Cohesion: 0.17
Nodes (17): ConsentBanner(), consentSettings(), createAnalytics(), enqueue(), start(), Job, LoginState, Options (+9 more)

### Community 98 - "Community 98"
Cohesion: 0.19
Nodes (12): CampaignCarousel, CampaignCarouselContainer(), endsLabel(), fetchActiveCampaigns(), CampaignSlide(), reveal(), ResponsivePicture(), ResponsivePictureProps (+4 more)

### Community 99 - "Community 99"
Cohesion: 0.20
Nodes (13): EventDetailPage(), SessionDetailPage(), SessionDetailPageProps, EventSessionsPage(), SessionsPageProps, StudioLayout(), EventDetailSkeleton(), SessionManagerContainer() (+5 more)

### Community 100 - "Community 100"
Cohesion: 0.17
Nodes (4): EventSessionService, SESSION_OVERLAP_MESSAGE, SessionOverlapError, IEventSessionRepository

### Community 101 - "Community 101"
Cohesion: 0.10
Nodes (20): @dnd-kit/utilities@^3.2.2, qrcode.react@4.2.0, react-dom@^19.2.8, @tiptap/extension-character-count@3.23.6, @tiptap/pm@^3.23.6, @tiptap/starter-kit@^3.23.6, vaul@^1.1.2, engines (+12 more)

### Community 102 - "Community 102"
Cohesion: 0.26
Nodes (7): MyProfileData, UserBadge, UserEvent, UserEventInteraction, UserSite, PublicProfileTabsProps, ProfileTimelineData

### Community 103 - "Community 103"
Cohesion: 0.14
Nodes (5): SiteTransitService, setup(), ISiteTransitReportRepository, FirebaseBaseRepository, SiteTransitReportFirebaseRepository

### Community 104 - "Community 104"
Cohesion: 0.19
Nodes (5): PlanSource, FirebaseUserDto, IUserMapper, UserFirebaseMapper, UserFirebaseRepository

### Community 105 - "Community 105"
Cohesion: 0.20
Nodes (14): cancelRegistrationAction(), CancelRegistrationActionResult, CancelRegistrationInput, ERRORS, checkInByCodeAction(), CheckInByCodeActionResult, ERRORS, ActionResult (+6 more)

### Community 106 - "Community 106"
Cohesion: 0.20
Nodes (13): AnalyticsProvider(), clearConsent(), CONSENT_KEY, ConsentChoice, parseConsent(), readConsent(), saveConsent(), Store (+5 more)

### Community 107 - "Community 107"
Cohesion: 0.20
Nodes (16): Tabs(), TabsContent(), TabsList(), tabsListVariants, TabsTrigger(), formatCompactNumber(), formatDateCompact(), formatDateShort() (+8 more)

### Community 109 - "Community 109"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 110 - "Community 110"
Cohesion: 0.18
Nodes (16): Tooltip(), TooltipContent(), TooltipTrigger(), HeartLikeButton, HeartLikeButtonProps, CLICKS_ITEM, EventStatsPanel(), EventStatsPanelProps (+8 more)

### Community 111 - "Community 111"
Cohesion: 0.13
Nodes (7): CreateSupportTicketInput, OrganizerOverview, bogotaMonthStart(), PipelineAnalytics, PipelineRegistrationRow, PipelineSessionRow, RegistrationUserInfo

### Community 112 - "Community 112"
Cohesion: 0.14
Nodes (3): Site, ISiteRepository, PaginatedSiteIds

### Community 113 - "Community 113"
Cohesion: 0.22
Nodes (15): CardLikeButton(), compactCount(), dayKeyFmt, dayNumber(), plainText(), registrationLabel(), spotsInfo, SpotsTone (+7 more)

### Community 114 - "Community 114"
Cohesion: 0.23
Nodes (9): Body, POST(), TAGS, hasValidBearer(), siteTagsToRevalidate(), tagsForChangedSites(), POST(), Body (+1 more)

### Community 115 - "Community 115"
Cohesion: 0.14
Nodes (9): CacheBackend, createClientCache(), invalidateMyData(), removeCache(), updateCache(), writeCache(), backend, c (+1 more)

### Community 116 - "Community 116"
Cohesion: 0.25
Nodes (12): EventsSearchInput(), EventsSearchInputProps, formatDateTime(), initials(), LIMIT_OPTIONS, PaginationLink(), RegistrationRowItem(), RegistrationsTable() (+4 more)

### Community 117 - "Community 117"
Cohesion: 0.22
Nodes (8): ExpiredRow, RECOMPUTE_BATCH, RECOMPUTE_BUDGET_MS, RecomputeDeps, recomputeExpiredSites(), RecomputeResult, selectExpired(), NOW

### Community 118 - "Community 118"
Cohesion: 0.29
Nodes (6): declarationDocId(), ContentDeclarationService, ContentDeclaration, DeclarationTargetType, IContentDeclarationRepository, ContentDeclarationFirebaseRepository

### Community 119 - "Community 119"
Cohesion: 0.24
Nodes (11): buildLocationDetails(), COUNTRY_ISO, DEPARTMENT_ISO, resolveGeoIso(), toGeoSlug(), APPLY, detailWithSlug(), main() (+3 more)

### Community 122 - "Community 122"
Cohesion: 0.19
Nodes (10): EventDescription(), clean(), Doc, extensions, isKnownNode(), isSafeMark(), Mark, Node (+2 more)

### Community 123 - "Community 123"
Cohesion: 0.27
Nodes (11): ERRORS, getMyCheckInCodeAction(), MyCheckInCodeResult, buildCheckInPayload(), CHECK_IN_CODE_LENGTH, formatCheckInCode(), generateCheckInCode(), isValidCheckInCode() (+3 more)

### Community 124 - "Community 124"
Cohesion: 0.25
Nodes (5): CampaignStatus, ACTIVE, INACTIVE, FirebaseCampaignDto, CampaignFirebaseRepository

### Community 125 - "Community 125"
Cohesion: 0.27
Nodes (7): getAccountCreatedAt(), RequestSiteClaimInput, countPending(), resolveSiteSuggestionAction(), suggestSiteChangeAction(), SuggestSiteChangeInput, siteSuggestionsTag()

### Community 126 - "Community 126"
Cohesion: 0.23
Nodes (9): AUTH_ERROR_MESSAGES, loginModalAction(), LoginModalActionResult, REGISTER_ERROR_MESSAGES, registerAction(), RegisterActionResult, ACCEPTANCE_REQUIRED_ERROR, hasValidAcceptance() (+1 more)

### Community 127 - "Community 127"
Cohesion: 0.19
Nodes (10): ServiceWorkerRegister(), geistMono, geistSans, inter, metadata, outfit, RootLayout(), SITE_JSONLD (+2 more)

### Community 128 - "Community 128"
Cohesion: 0.28
Nodes (9): generateSuffix, generateUniqueUsernameCandidate(), generateUsername(), CreateUserDto, CreateUserSchema, HttpUrl, SOCIAL_PLATFORMS, UpdateUserDto (+1 more)

### Community 129 - "Community 129"
Cohesion: 0.24
Nodes (9): clientCtaRegistry(), CtaRegistry, CtaRegistryKeys, serverCtaRegistry, BaseCTA, CtaExternalLinkEntity, CtaNavigateEntity, ExternalLinkCTA (+1 more)

### Community 131 - "Community 131"
Cohesion: 0.17
Nodes (11): env, availability, secret, value, variable, runConfig, concurrency, cpu (+3 more)

### Community 132 - "Community 132"
Cohesion: 0.18
Nodes (10): CampaignDto, CampaignSchema, ImageSchema, ImageVariantsSchema, CampaignEntityType, EVENT, INTERNAL, NIGHTCLUB (+2 more)

### Community 134 - "Community 134"
Cohesion: 0.23
Nodes (10): CURRENT_CACHES, IMAGE_HOSTS, isCacheablePage(), isPrivatePath(), NO_CACHE_PREFIXES, offlineFallback(), pageCacheKey(), staleWhileRevalidateImage() (+2 more)

### Community 135 - "Community 135"
Cohesion: 0.29
Nodes (8): countPending(), getPendingInvitationsCountAction(), fetchStats(), fetchUserBadges(), metadata, ProfilePage(), PendingInvitationsBanner(), getCachedProfileStats()

### Community 136 - "Community 136"
Cohesion: 0.31
Nodes (9): cancelBlock, canShowCheckInQr(), registrationCounts(), RegistrationStatus, splitRegistrations(), statusLabel(), h(), item() (+1 more)

### Community 137 - "Community 137"
Cohesion: 0.29
Nodes (8): RichTextEditor(), RichTextEditorProps, Divider(), Toolbar(), ToolbarProps, ToolbarButton(), ToolbarButtonProps, @tiptap/react

### Community 138 - "Community 138"
Cohesion: 0.22
Nodes (10): ANY, APPLY, args, CLEAR, countArg, countFlagIdx, inheritedLocation(), main() (+2 more)

### Community 139 - "Community 139"
Cohesion: 0.20
Nodes (9): APPLY, args, CLEAR, CLICKS, generateRegistrations(), main(), NAMES, SeedReg (+1 more)

### Community 140 - "Community 140"
Cohesion: 0.38
Nodes (8): cachedTeamEvents(), getCachedUserPlan(), getEventAccess(), getMyTeamAccess(), isStudioEventOwner(), listMyTeamEvents(), loadEventFresh, hasTeamEventsAction()

### Community 141 - "Community 141"
Cohesion: 0.20
Nodes (3): AnalyticsSdk, Call, fakeSdk()

### Community 142 - "Community 142"
Cohesion: 0.20
Nodes (9): env, availability, secret, value, variable, runConfig, cpu, memoryMiB (+1 more)

### Community 143 - "Community 143"
Cohesion: 0.33
Nodes (7): RegistrationSortBy, EmptyRegistrations(), ExternalClicksPanel(), ExternalClicksPanelProps, formatNumber(), RegistrationsPanel(), RegistrationsPanelProps

### Community 144 - "Community 144"
Cohesion: 0.36
Nodes (6): CookiePreferencesButton(), Footer(), LINKS, FooterYear(), TE_PROTEJO_URL, InstallPrompt()

### Community 145 - "Community 145"
Cohesion: 0.36
Nodes (8): BANNER_PATHS, BeforeInstallPromptEvent, countVisit(), getEnv(), InstallBanner(), noopSubscribe(), readDismissed(), useInstall()

### Community 146 - "Community 146"
Cohesion: 0.25
Nodes (8): ENTITIES, generateUploadUrl(), GenerateUploadUrlOptions, OWN_UID_ENTITIES, sanitizeFileName(), SUBFOLDERS, UploadResult, UploadVisibility

### Community 147 - "Community 147"
Cohesion: 0.19
Nodes (7): APPLY, args, main(), resolveIdx, APPLY, main(), UPDATES

### Community 148 - "Community 148"
Cohesion: 0.22
Nodes (6): APPLY, args, CAMPAIGNS, CLEAN, main(), now

### Community 149 - "Community 149"
Cohesion: 0.36
Nodes (7): isOrbMode(), MagicCard(), MagicCardBaseProps, MagicCardGradientProps, MagicCardOrbProps, MagicCardProps, ResetReason

### Community 151 - "Community 151"
Cohesion: 0.25
Nodes (7): allowBuilds, esbuild, @firebase/util, protobufjs, unrs-resolver, overrides, source-map-js

### Community 152 - "Community 152"
Cohesion: 0.29
Nodes (5): StepDef, stepIcons, StepperProps, MULTI_DATE_HEADER_STEPS, STEPS

### Community 153 - "Community 153"
Cohesion: 0.43
Nodes (4): createLikeSync(), LikeState, LikeSyncOptions, setup()

### Community 154 - "Community 154"
Cohesion: 0.29
Nodes (6): ICONS, iconSvg(), main(), OUT_DIR, requireFromNext, Sharp

### Community 155 - "Community 155"
Cohesion: 0.29
Nodes (7): APPLY, CLEAN, GALLERY_IMAGES, GALLERY_VIDEOS, main(), SAMPLE_EVENTS, slugify()

### Community 156 - "Community 156"
Cohesion: 0.67
Nodes (5): Accordion(), AccordionContent(), AccordionItem(), AccordionTrigger(), SectionsAccordion()

### Community 157 - "Community 157"
Cohesion: 0.38
Nodes (6): EventMultiDateSlot(), SlotProps, formatDate(), formatNumber(), MultiDateStatsPanel(), getCachedMultiDateEventStats()

### Community 159 - "Community 159"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, start, test, typecheck

### Community 160 - "Community 160"
Cohesion: 0.57
Nodes (6): isFirestoreTimestampLike(), isFirestoreTimestampLiteral(), isIsoDateString(), isPlainObject(), transformDatesToIsoStringsRecursively(), transformIsoStringsToDatesRecursively()

### Community 161 - "Community 161"
Cohesion: 0.38
Nodes (6): config, isPrivatePath(), loginRedirect(), PRIVATE_PATHS, proxy(), PUBLIC_PATHS

### Community 162 - "Community 162"
Cohesion: 0.38
Nodes (5): FIRST, LAST, main(), pick(), slug()

### Community 163 - "Community 163"
Cohesion: 0.33
Nodes (6): APPLY, args, CLEAR, generate(), InteractionType, main()

### Community 164 - "Community 164"
Cohesion: 0.33
Nodes (4): next-themes@^0.4.6, sonner@^2.0.7, next-themes, sonner

### Community 165 - "Community 165"
Cohesion: 0.53
Nodes (5): SessionCoverSource, formatSessionDate(), resolveSessionCover(), SessionCoverSelector(), SessionCoverSelectorProps

### Community 166 - "Community 166"
Cohesion: 0.73
Nodes (5): cityDetail(), detailWithSlug(), toDomainLocation(), toLatLng(), toStoredLocation()

### Community 167 - "Community 167"
Cohesion: 0.70
Nodes (4): fetchLike(), GET(), getLikes(), POST()

### Community 173 - "Community 173"
Cohesion: 0.67
Nodes (3): APPLY, main(), toMillis()

### Community 174 - "Community 174"
Cohesion: 0.67
Nodes (3): APPLY, main(), num()

### Community 175 - "Community 175"
Cohesion: 0.50
Nodes (3): APPLY, BADGES_TO_SEED, main()

## Knowledge Gaps
- **7 isolated node(s):** `EVENT`, `RESTAURANT`, `NIGHTCLUB`, `INTERNAL`, `PROMOTION` (+2 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 1054 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **50 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Community 25` to `Community 0`, `Community 1`, `Community 2`, `Community 129`, `Community 4`, `Community 5`, `Community 135`, `Community 8`, `Community 9`, `Community 10`, `Community 7`, `Community 140`, `Community 12`, `Community 13`, `Community 144`, `Community 145`, `Community 18`, `Community 19`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 28`, `Community 157`, `Community 30`, `Community 31`, `Community 161`, `Community 34`, `Community 35`, `Community 36`, `Community 165`, `Community 38`, `Community 39`, `Community 167`, `Community 41`, `Community 40`, `Community 43`, `Community 47`, `Community 52`, `Community 54`, `Community 56`, `Community 60`, `Community 61`, `Community 63`, `Community 67`, `Community 68`, `Community 71`, `Community 72`, `Community 73`, `Community 74`, `Community 77`, `Community 79`, `Community 81`, `Community 82`, `Community 83`, `Community 84`, `Community 86`, `Community 87`, `Community 91`, `Community 96`, `Community 97`, `Community 98`, `Community 99`, `Community 101`, `Community 105`, `Community 106`, `Community 107`, `Community 110`, `Community 113`, `Community 114`, `Community 116`, `Community 125`, `Community 126`, `Community 127`?**
  _High betweenness centrality (0.148) - this node is a cross-community bridge._
- **What connects `EVENT`, `RESTAURANT`, `NIGHTCLUB` to the rest of the system?**
  _7 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0429202608878603 - nodes in this community are weakly interconnected._
- **Why does `createServerContainer()` connect `Community 61` to `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 9`, `Community 10`, `Community 11`, `Community 16`, `Community 18`, `Community 19`, `Community 21`, `Community 22`, `Community 23`, `Community 24`, `Community 25`, `Community 26`, `Community 27`, `Community 28`, `Community 29`, `Community 30`, `Community 31`, `Community 32`, `Community 33`, `Community 34`, `Community 37`, `Community 38`, `Community 39`, `Community 40`, `Community 42`, `Community 45`, `Community 46`, `Community 47`, `Community 48`, `Community 51`, `Community 52`, `Community 53`, `Community 55`, `Community 56`, `Community 57`, `Community 58`, `Community 59`, `Community 60`, `Community 62`, `Community 64`, `Community 66`, `Community 68`, `Community 69`, `Community 70`, `Community 71`, `Community 72`, `Community 74`, `Community 75`, `Community 76`, `Community 78`, `Community 79`, `Community 80`, `Community 83`, `Community 84`, `Community 86`, `Community 87`, `Community 91`, `Community 92`, `Community 93`, `Community 96`, `Community 98`, `Community 99`, `Community 100`, `Community 103`, `Community 104`, `Community 105`, `Community 108`, `Community 114`, `Community 118`, `Community 121`, `Community 123`, `Community 124`, `Community 125`, `Community 126`, `Community 130`, `Community 133`, `Community 135`, `Community 140`, `Community 146`, `Community 157`, `Community 158`, `Community 167`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Why does `cn()` connect `Community 6` to `Community 0`, `Community 4`, `Community 5`, `Community 7`, `Community 8`, `Community 137`, `Community 10`, `Community 12`, `Community 13`, `Community 17`, `Community 20`, `Community 21`, `Community 149`, `Community 23`, `Community 25`, `Community 27`, `Community 156`, `Community 28`, `Community 157`, `Community 31`, `Community 35`, `Community 36`, `Community 165`, `Community 39`, `Community 40`, `Community 41`, `Community 43`, `Community 47`, `Community 52`, `Community 54`, `Community 55`, `Community 63`, `Community 65`, `Community 66`, `Community 68`, `Community 73`, `Community 74`, `Community 77`, `Community 79`, `Community 82`, `Community 84`, `Community 85`, `Community 98`, `Community 107`, `Community 110`, `Community 113`, `Community 116`, `Community 127`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.054203180785459264 - nodes in this community are weakly interconnected._