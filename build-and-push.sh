image_name="pluce/frik"
repo_base_url=$DOCKER_REPO

if [ "$1" = "help" ]; then
	echo "Build image and push them to GKE"
	echo "> ./build-and-push.sh"
	echo "Will push to pre-production repo"
	echo "---"
	echo "Be sure that you validate both these conditions:"
	echo " - docker is installed"
	echo " - gcloud sdk is installed and you're logged in"
	exit
fi

echo "> Ok, let's start"

echo "> Let's build "

docker build -t $image_name .

if [ $? -ne 0 ]; then
	echo ">< Failed building $image_name image."
	exit 1
fi

echo "> Everything is good"

echo "> We're pushing to $repo_base_url"

image_id=$(docker images -q |head -1)

echo "> Let's tag and push $image_name. Hash is $image_id"

docker tag $image_id $repo_base_url/$image_name:$image_id

if [ $? -ne 0 ]; then
	echo ">< Failed tagging $image_name image."
	exit 1
fi

gcloud docker -- push $repo_base_url/$image_name:$image_id

if [ $? -ne 0 ]; then
	echo ">< Failed pushing $image_name image."
	exit 1
fi

echo "> Everything is good"
