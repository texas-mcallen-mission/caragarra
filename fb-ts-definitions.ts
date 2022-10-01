/* INTERNAL DEFINITIONS */


interface extra_args {
    time_since?: Date | string,
    time_until?: Date | string,
    // maximum_entries?: boolean,
    include_pages?: boolean,

}

interface parsed_post_data {
    likes: number,
    comments: number,
    shares: number,
    message: string,
    created_time: string,
    is_popular: boolean;
}

interface like_data {
    data: any[],
    summary?: { // to get this, request like.summary(true)
        total_count: number,
        can_like: boolean,
        has_liked: boolean;
    };
}

// this is essentially a more explicit declaration so that I can guarantee that stat numbers will be there.

interface post_struct_extra_stats extends post_struct {
    created_time: string, // default if no fields are requested
    message: string, // default if no fields are requested
    likes: like_data_extra_stats,
    comments: comment_data_extra_stats,
    shares?: share_data,
    is_popular:boolean,
}

interface like_data_extra_stats extends like_data {
    summary: { 
        total_count: number,
        can_like: boolean,
        has_liked: boolean;
    };
}

interface comment_data_extra_stats extends comment_data {
    summary: {
        total_count: number,
        can_comment: boolean
    }
}

interface comment_data {
    data: any[],
    summary?: { // to get this, request comment.summary(true)
        total_count: number,
        can_comment: boolean,
    };
}

interface share_data {
    count: number;
}


interface post_struct {
    id: string, // default, always present
    created_time?: string, // default if no fields are requested
    message?: string, // default if no fields are requested
    likes?: like_data,
    comments?: comment_data,
    shares?: share_data,
    is_popular?: boolean,
}

interface category_list_struct {
    id: string,
    name: string,
}

enum task_options {
    "ANALYZE" = "ANALYZE",
    "ADVERTISE" = "ADVERTISE",
    "MESSAGING" = "MESSAGING",
    "MODERATE" = "MODERATE",
    "CREATE_CONTENT" = "CREATE_CONTENT",
    "MANAGE" = "MANAGE"

}

interface pageManagementData_struct {
    access_token: string,
    category: string,
    category_list: category_list_struct[];
    name: string,
    id: string,
    tasks: task_options[],
    page_access_token: string,
}



/* INTERFACE DEFINITIONS */

// interface dynamic_posts_struct {
//     data: any[], // a list of RTBDynamicPost nodes
//     paging: {};
// }

interface comment_struct {
    data: any[], // list of comment nodes
    paging: {},
    summary: {},
}

// enum date_preset_enum {
//     today = "today",
//     yesterday = "yesterday",
//     this_month = "this_month",
//     last_month = "last_month",
//     this_quarter = "this_quarter",
//     maximum = "maximum",
//     last_3d = "last_3d",
//     last_7d = "last_7d",
//     last_14d = "last_14d",
//     last_28d = "last_28d",
//     last_30d = "last_30d",
//     last_90d = "last_90d",
//     last_week_mon_sun = "last_week_mon_sun",
//     last_week_sun_sat = "last_week_sun_sat",
//     last_quarter = "last_quarter",
//     last_year = "last_year",
//     this_week_mon_today = "this_week_mon_today",
//     this_week_sun_today = "this_week_sun_today",
//     this_year = "this_year",
// }

enum period_enum {
    day = "day",
    week = "week",
    days_28 = "days_28",
    month = "month",
    lifetime = "lifetime",
}

// interface insight_parameter_struct {
//     date_preset: date_preset_enum,
//     metric: any[], // the list of metrics that need to be fetched
//     period: period_enum,
//     since: string, // to convert to datetime
//     until: string, // to convert to datetime
// }

// interface insight_struct {
//     data: any[]; // a list of InsightsResult nodes,
//     paging: {};
// }

// interface sharedposts_struct {
//     data: any[], // I dont know what this looks like, sorry 
//     paging: {},
// }

// interface sponsor_tags_struct {
//     data: any[], // a list of fpage nodes
//     paging: {},
// }

// interface to_struct {
//     data: any[], // a list of Profile nodes
//     paging: {};
// }

// interface fb_page_object_struct {

// }

// interface fb_page_object_fields {
//     // edges
//     comments: comment_struct,
//     dynamic_posts: dynamic_posts_struct,
//     insights: insight_struct,
//     sharedposts: sharedposts_struct,
//     sponsor_tags: sponsor_tags_struct,
//     to: to_struct,


//     // fields
//     id: string,
//     actions: any[], // list
//     admin_creator: "BusinessUser" | "User" | "Application",
//     allowed_advertising_objectives: string[], //list<string>
//     application: any,
//     backdated_time: string,
//     call_to_action: { type: any, value: any; },
//     can_reply_privately: boolean,
//     caption: string, // deprecated
//     child_attachments: any[], // not quite sure what lists contain yet...
//     comments_mirroring_domain: string,
//     coordinates: coordinates_struct,
//     created_time: string,
//     description: string,
//     expanded_height: number, // unsigned int32
//     expanded_width: number, // unsigned int32
//     feed_targeting: feed_targeting_struct,
//     from: string, // "User|Page", need to figure this out eventually
//     full_picture: string,
//     height: number, // unsigned int32
//     icon: string,
//     instagram_eligibility: "eligible" | string,
//     is_app_share: boolean,
//     is_eligible_for_promotion: boolean,
//     is_expired: boolean,
//     is_hidden: boolean,
//     is_inline_created: boolean, // returns true if the post was created inline when creating ads
//     is_instagram_eligible: boolean,
//     is_popular: boolean, // whether or not a post is currently popular.
//     is_published: boolean, // whether or not a scheduled post was published
//     is_spherical: boolean, // whether or not it's a 360 degree video post
//     link: string, // uri
//     message: string, // the post's message
//     message_tags: {}, // profiles mentioned or tagged in a message.  This is an object with a unique keey for each mention or tag in the message
//     multi_share_end_card: boolean, // whether display the end card for a multi-link share post.
//     multi_share_optimized: boolean, // whether automatically select the order of the links in multi-link share post when used in an ad
//     name: string,
//     object_id: string, // the ID of any uploaded photo or video attached to the post.
//     parent_id: any,
//     permalink_url: string, // uri
//     place: any, // Place
//     privacy: any, // Privacy
//     properties: any, // a list of properties for any attached video, for example, the length of the video
//     scheduled_publish_time: number, // float
//     shares: { keys: number; },
//     source: string; // a URL to any Flash movie or video attached to the post // probably deprecated...
//     status_type: string,
//     story: string, // text of stories not intentionally generated by users
//     story_tags: string[], // the list of tags in the post description
//     subscribed: boolean,
//     targeting: targeting_object_struct,
//     timeline_visibility: string,
//     type: string,
//     updated_time: string,
//     via: string, // "User | Page"
//     video_buying_eligibility: any[], // no idea...
//     width: number; // unsigned int32

// }

// interface targeting_object_struct {
//     country: any;
//     cities: any;
//     // AND MANY MORE!!!
// }

// enum post_object_keys {

// }

// interface feed_targeting_struct { // I have no idea what this looks like IRL yet...
//     country: any,
//     cities: any,
//     regions: any,
//     genders: any,
//     age_min: any,
//     age_max: any,
//     education_statuses: any,
//     college_years: any,
//     relationship_statuses: any,
//     interests: any,
//     interested_in: any,
//     user_adclusters: any,
//     locales: any,
//     countries: any,
//     geo_locations: any,
//     work_positions: any,
//     work_employers: any,
//     education_majors: any,
//     education_schools: any,
//     family_statuses: any,
//     life_events: any,
//     industries: any,
//     politics: any,
//     enthic_affinity: any,
//     generation: any,
//     fan_of: any,
//     relevant_until_ts: any,
// }

// interface coordinates_struct {
//     checkin_id: string,
//     author_uid: string,
//     page_id: string,
//     target_id: string,
//     target_href: string,
//     coords: string,
//     tagged_uids: string,
//     timestamp: string, // we have to convert these to dates internally, btw
//     message: string,
//     target_type: string; // no idea what this is...
// }